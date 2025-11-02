from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import webbrowser
import os

def run(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print(f'Server running at http://localhost:{port}/')
    
    # Open the browser
    webbrowser.open(f'http://localhost:{port}/')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()

if __name__ == '__main__':
    run()