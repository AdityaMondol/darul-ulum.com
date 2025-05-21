// Basic Node.js HTTP server
const http = require('http');
const fs = require('fs');
const path = require('path'); // Added path module
const crypto = require('crypto');

const USERS_FILE = './data/users.json';
const NOTICES_FILE = './data/notices.json';
const COMMENTS_FILE = './data/comments.json';
const MEDIA_FILE = './data/media.json';

// Generic helper function to read data from a JSON file
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid JSON, return empty array
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return [];
    }
    throw error; // Re-throw other errors
  }
}

// Generic helper function to write data to a JSON file
function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const server = http.createServer((req, res) => {
  // Handle /signup endpoint
  if (req.url === '/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { firstName, lastName, email, password, role } = JSON.parse(body);

        if (!firstName || !lastName || !email || !password || !role) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'All fields are required' }));
          return;
        }

        // Basic email validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid email format' }));
            return;
        }

        const users = readData(USERS_FILE);
        if (users.find(user => user.email === email)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User already exists' }));
          return;
        }

        const hashedPassword = hashPassword(password);
        const newUser = {
          id: Date.now().toString(),
          firstName,
          lastName,
          email,
          hashedPassword,
          role
        };

        users.push(newUser);
        writeData(USERS_FILE, users);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User created successfully' }));
      } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        } else {
            console.error('Error during signup:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });
  }
  // Handle /login endpoint
  else if (req.url === '/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const users = readData(USERS_FILE);
        const user = users.find(user => user.email === email);

        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }

        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.hashedPassword) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Login successful',
          user: {
            id: user.id,
            firstName: user.firstName,
            email: user.email,
            role: user.role
          }
        }));
      } catch (error) {
         if (error instanceof SyntaxError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        } else {
            console.error('Error during login:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });
  }
  // Handle root path
  else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is running' }));
  }
  // Handle not found
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
  // Handle /notices GET endpoint
  else if (req.url === '/notices' && req.method === 'GET') {
    try {
      const notices = readData(NOTICES_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(notices));
    } catch (error) {
      console.error('Error reading notices:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  // Handle /notices POST endpoint
  else if (req.url === '/notices' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { text, userName } = JSON.parse(body);

        if (!text || !userName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Text and userName are required' }));
          return;
        }

        const notices = readData(NOTICES_FILE);
        const newNotice = {
          id: Date.now().toString(),
          text,
          userName,
          timestamp: new Date().toISOString()
        };

        notices.push(newNotice);
        writeData(NOTICES_FILE, notices);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newNotice));
      } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        } else {
            console.error('Error creating notice:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });
  }
  // Handle /notices/:id DELETE endpoint
  else if (req.url.startsWith('/notices/') && req.method === 'DELETE') {
    try {
      const noticeId = req.url.split('/')[2];
      const notices = readData(NOTICES_FILE);
      const initialLength = notices.length;
      const updatedNotices = notices.filter(notice => notice.id !== noticeId);

      if (updatedNotices.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Notice not found' }));
        return;
      }

      writeData(NOTICES_FILE, updatedNotices);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Notice deleted successfully' }));
    } catch (error) {
      console.error('Error deleting notice:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  // Handle /comments GET endpoint
  else if (req.url === '/comments' && req.method === 'GET') {
    try {
      const comments = readData(COMMENTS_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(comments));
    } catch (error) {
      console.error('Error reading comments:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  // Handle /comments POST endpoint
  else if (req.url === '/comments' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { text, userName } = JSON.parse(body);

        if (!text || !userName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Text and userName are required' }));
          return;
        }

        const comments = readData(COMMENTS_FILE);
        const newComment = {
          id: Date.now().toString(),
          text,
          userName,
          timestamp: new Date().toISOString()
        };

        comments.push(newComment);
        writeData(COMMENTS_FILE, comments);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newComment));
      } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        } else {
            console.error('Error creating comment:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });
  }
  // Handle /comments/:id DELETE endpoint
  else if (req.url.startsWith('/comments/') && req.method === 'DELETE') {
    try {
      const commentId = req.url.split('/')[2];
      const comments = readData(COMMENTS_FILE);
      const initialLength = comments.length;
      const updatedComments = comments.filter(comment => comment.id !== commentId);

      if (updatedComments.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Comment not found' }));
        return;
      }

      writeData(COMMENTS_FILE, updatedComments);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Comment deleted successfully' }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  // Handle /uploads/:filename GET endpoint (Static File Serving)
  else if (req.url.startsWith('/uploads/') && req.method === 'GET') {
    const filename = req.url.split('/')[2];
    if (!filename) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Filename is required' }));
        return;
    }
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream'; // Default
      if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      } else if (ext === '.mp4') {
        contentType = 'video/mp4';
      } else if (ext === '.pdf') {
        contentType = 'application/pdf';
      }
      // Add more content types as needed

      res.writeHead(200, { 'Content-Type': contentType });
      const readStream = fs.createReadStream(filePath);
      readStream.on('error', (streamErr) => {
        console.error('Error streaming file:', streamErr);
        // It's tricky to change headers once the stream has started
        // For simplicity, we'll just end the response.
        // A more robust solution might involve error events before headers are sent.
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error streaming file' }));
        } else {
            res.end(); // End the stream if headers already sent
        }
      });
      readStream.pipe(res);
    });
  }
  // Handle /media GET endpoint
  else if (req.url === '/media' && req.method === 'GET') {
    try {
      const media = readData(MEDIA_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(media));
    } catch (error) {
      console.error('Error reading media data:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  // Handle /media/upload POST endpoint (Attempting basic multipart parser)
  else if (req.url === '/media/upload' && req.method === 'POST') {
    const contentTypeHeader = req.headers['content-type'];
    if (!contentTypeHeader || !contentTypeHeader.includes('multipart/form-data')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }));
      return;
    }

    const boundary = contentTypeHeader.split('boundary=')[1];
    if (!boundary) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid multipart/form-data: boundary not found' }));
        return;
    }

    let body = [];
    req.on('data', chunk => {
      body.push(chunk);
    });
    req.on('end', () => {
      const payload = Buffer.concat(body);
      // Manual parsing is very complex. This is a simplified attempt
      // and might not work for all cases or be robust.
      try {
        const parts = payload.toString().split(`--${boundary}`);
        let fileData = null;
        let originalFilename = 'unknown';
        let uploader = 'anonymous'; // Placeholder

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="file"')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            if (filenameMatch && filenameMatch[1]) {
              originalFilename = filenameMatch[1];
            }
            // Extract content: find the start of the actual file data
            const contentStartIndex = part.indexOf('\r\n\r\n') + 4;
            // The end of the file data is just before the next boundary or the end of the part
            // This simplified logic assumes file is the last part or only part for simplicity
            // and doesn't correctly handle trailing CRLF before boundary.
            let contentEndIndex = part.length - 2; // Assuming trailing \r\n
            if (part.endsWith('\r\n--')) { // If it's the closing boundary part
                contentEndIndex = part.lastIndexOf('\r\n--', part.length -4);
            } else if (part.endsWith('\r\n')) {
                 contentEndIndex = part.length -2;
            }


            if (contentStartIndex < contentEndIndex && contentStartIndex > 0) {
                // Need to convert the part back to a buffer to correctly slice binary data
                const partBuffer = Buffer.from(part, 'binary'); // Use binary encoding
                fileData = partBuffer.slice(contentStartIndex, contentEndIndex);
                break; // Found the file part, stop.
            }
          } else if (part.includes('Content-Disposition: form-data; name="uploader"')) {
             const uploaderMatch = part.match(/Content-Disposition: form-data; name="uploader"\r\n\r\n(.+?)\r\n/s);
             if (uploaderMatch && uploaderMatch[1]) {
                 uploader = uploaderMatch[1].trim();
             }
          }
        }

        if (!fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File data not found in payload or parsing failed' }));
          return;
        }

        const newFilename = `${Date.now()}-${originalFilename}`;
        const filePath = path.join(__dirname, 'uploads', newFilename);

        fs.writeFile(filePath, fileData, { encoding: 'binary' }, (err) => { // Specify binary encoding
          if (err) {
            console.error('Error saving file:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error saving file' }));
            return;
          }

          const media = readData(MEDIA_FILE);
          const newMediaEntry = {
            id: Date.now().toString(),
            originalFilename,
            newFilename,
            path: `/uploads/${newFilename}`,
            uploader, // Assuming uploader comes from form or is hardcoded
            timestamp: new Date().toISOString()
          };
          media.push(newMediaEntry);
          writeData(MEDIA_FILE, media);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newMediaEntry));
        });
      } catch (parseError) {
        console.error('Error parsing multipart/form-data:', parseError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error parsing form data. Manual parsing is complex and may have failed.' }));
      }
    });
    req.on('error', (err) => {
        console.error('Request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request error' }));
    });
  }
  // Handle /media/:id DELETE endpoint
  else if (req.url.startsWith('/media/') && req.method === 'DELETE') {
    try {
      const mediaId = req.url.split('/')[2];
      const media = readData(MEDIA_FILE);
      const mediaToDelete = media.find(m => m.id === mediaId);

      if (!mediaToDelete) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Media not found in metadata' }));
        return;
      }

      const filePath = path.join(__dirname, 'uploads', mediaToDelete.newFilename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') { // ENOENT means file already deleted, which is fine
          console.error('Error deleting file:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting file from filesystem' }));
          return;
        }

        const updatedMedia = media.filter(m => m.id !== mediaId);
        writeData(MEDIA_FILE, updatedMedia);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Media deleted successfully' }));
      });
    } catch (error) {
      console.error('Error processing delete media request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
