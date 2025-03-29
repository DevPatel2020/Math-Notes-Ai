import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SERVER_URL = 'localhost'  # Change if running on a different host
PORT = 8900  # Ensure this is an integer
ENV = 'dev'

# Fetch API key from .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Debugging: Check if the key is being loaded (Remove in production)
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY is not set!")
