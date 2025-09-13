# CORS Configuration for API Server

## Issue
The frontend application at `http://localhost:3000` is unable to connect to the API at `http://127.0.0.1:8000/api` due to CORS (Cross-Origin Resource Sharing) policy restrictions.

## Error Message
```
Access to fetch at 'http://127.0.0.1:8000/api/web/search/registered/TEST123' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Solution

Your API server at `http://127.0.0.1:8000` needs to enable CORS headers to allow requests from the Next.js frontend.

### For FastAPI (Python)
If your API is built with FastAPI, add CORS middleware:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Or specify: ["GET", "POST"]
    allow_headers=["*"],
)
```

### For Express.js (Node.js)
If your API is built with Express:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Configure CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
```

### For Django (Python)
Install django-cors-headers and configure:

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    ...
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### For Flask (Python)
Install flask-cors and configure:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
```

## Testing
After enabling CORS on your API server:
1. Restart your API server
2. The Next.js application should now be able to successfully fetch data from the API
3. The product verification feature will work as expected

## Security Note
In production, replace `http://localhost:3000` with your actual frontend domain and be specific about allowed origins for security.
