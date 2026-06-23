const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/chat - Protected route
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let statsContext = '';
    try {
      // Execute database queries in parallel to gather context
      const [vesselsRes, revenueRes, cargoRes, expensesRes] = await Promise.all([
        pool.query(`
          SELECT 
            year, 
            COUNT(DISTINCT vessel_name || vcn || year::text) as total_vessels, 
            SUM(amount_inr) as total_revenue, 
            SUM(grt) as total_tonnage 
          FROM port_statistics 
          GROUP BY year 
          ORDER BY year DESC 
          LIMIT 5
        `),
        pool.query(`
          SELECT 
            ps.year, 
            COALESCE(rcm.category, 'Other') as category, 
            SUM(ps.amount_inr) as amount
          FROM port_statistics ps
          LEFT JOIN revenue_category_map rcm ON (
            (UPPER(ps.invoice_group) = UPPER(rcm.raw_value) AND rcm.field_source = 'invoice_group')
            OR (UPPER(ps.charge_name) = UPPER(rcm.raw_value) AND rcm.field_source = 'charge_name')
            OR (UPPER(ps.sub_group) = UPPER(rcm.raw_value) AND rcm.field_source = 'sub_group')
          )
          GROUP BY ps.year, COALESCE(rcm.category, 'Other')
          ORDER BY ps.year DESC, amount DESC
          LIMIT 20
        `),
        pool.query(`
          SELECT 
            ps.year, 
            COALESCE(ccm.category, 'Other') as category, 
            SUM(ps.grt) as quantity
          FROM port_statistics ps
          LEFT JOIN cargo_category_map ccm ON (
            UPPER(ps.commodity_group) = UPPER(ccm.raw_value) AND ccm.field_source = 'commodity_group'
          )
          GROUP BY ps.year, COALESCE(ccm.category, 'Other')
          ORDER BY ps.year DESC, quantity DESC
          LIMIT 20
        `),
        pool.query(`
          SELECT 
            year, 
            amount as operating_cost 
          FROM operating_expenses 
          ORDER BY year DESC 
          LIMIT 5
        `)
      ]);

      const contextObj = {
        recent_yearly_aggregates: vesselsRes.rows,
        revenue_breakdown: revenueRes.rows,
        cargo_breakdown: cargoRes.rows,
        operating_expenses: expensesRes.rows
      };

      statsContext = JSON.stringify(contextObj);
    } catch (dbError) {
      console.error('Database query failure during stats context gathering:', dbError);
      statsContext = 'Live data is temporarily unavailable.';
    }

    const systemInstruction = `You are PortBot, an AI assistant for the Cochin Port Authority analytics platform. You have access to the following live statistical data from the port's database:

${statsContext}

Your job is to answer questions about this data clearly and concisely — vessel counts, revenue trends, cargo categories, tonnage, operating costs, profit margins, and year-over-year comparisons. If a question is not related to port operations, shipping analytics, or the data above, respond with: 'I can only help with port analytics and statistics. Please ask me about revenue, cargo, vessels, or financial performance.' Do not answer general knowledge questions, coding questions, or anything unrelated to this platform's data.`;

    // Limit conversation history to the last 10 messages (5 turns)
    const contents = [];
    if (Array.isArray(history)) {
      contents.push(...history.slice(-10));
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    // Call Gemini API via fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API request failed:', response.status, errBody);
      return res.status(502).json({ error: "Sorry, I couldn't reach the analytics server. Please try again." });
    }

    const resJson = await response.json();
    const reply = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't formulate a response.";
    res.json({ reply });

  } catch (error) {
    console.error('Unhandled error in chat handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
