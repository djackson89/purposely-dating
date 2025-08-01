// Temporary script to update password - this will be deleted after use
fetch('https://csupviqxprhtrbfbugct.supabase.co/functions/v1/update-user-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdXB2aXF4cHJodHJiZmJ1Z2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjkzMDAsImV4cCI6MjA2OTA0NTMwMH0.n6TVqq3meOhshgGzTfMt2Ef90mSYi8mxUz2UXteyHzg'
  },
  body: JSON.stringify({
    email: 'thepurposelyapp@gmail.com',
    password: 'thepurposelyapp1!'
  })
})
.then(response => response.json())
.then(data => console.log('Password update result:', data))
.catch(error => console.error('Error:', error));