const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
  const loginUrl = 'http://localhost:5000/api/auth/login';
  const uploadUrl = 'http://localhost:5000/api/reports/upload';
  
  try {
    console.log('Logging in as analyst...');
    const loginRes = await axios.post(loginUrl, {
      email: 'analyst@portauthority.gov.in',
      password: 'analyst123'
    });
    
    // Extract token from response cookies
    const cookieHeader = loginRes.headers['set-cookie'];
    if (!cookieHeader) {
      throw new Error('No set-cookie header received during login');
    }
    const tokenCookie = cookieHeader[0].split(';')[0];
    console.log('Logged in successfully. Cookie:', tokenCookie);
    
    // Read the sample Excel file
    const filePath = path.join(__dirname, '..', 'test_sample_dirty.xlsx');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found at ${filePath}`);
    }
    
    const form = new FormData();
    form.append('year', '2026');
    form.append('file', fs.createReadStream(filePath), {
      filename: 'test_sample_dirty.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('Uploading test_sample_dirty.xlsx for year 2026...');
    const uploadRes = await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: tokenCookie
      }
    });
    
    console.log('Upload Response Status:', uploadRes.status);
    console.log('Upload Response Data:', JSON.stringify(uploadRes.data, null, 2));
    
  } catch (err) {
    console.error('Test upload failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

testUpload();
