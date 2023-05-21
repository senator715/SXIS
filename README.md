![Logo](https://github.com/senator715/SXIS/assets/89423559/bc819c80-d0e8-4ce0-bf89-f1461432abc4)
#
SXIS provides a comprehensive solution written in JavaScript using NodeJS that eliminates the need for third-party ShareX providers. With SXIS, you can set up your server to share images, videos, and files securely and privately.
# Why SXIS?
1. Supports ShareX, allowing you to easily share images, text documents, clipboard text, files, and more.
1. Uses a unique approach to privacy by encrypting files stored on the server with AES128/AES256; only the person with the link can view the file; this means that if the server is compromised, your files are not possible for an attacker to decrypt, this makes sharing sensitive files safe and secure.
2. Includes lossless compression support for all file types apart from videos.
3. The ability to automatically delete uploaded files after a specific time frame.
# Dependencies used
1. https://www.npmjs.com/package/aes-js
2. https://www.npmjs.com/package/debug
3. https://www.npmjs.com/package/mime-types
4. https://www.npmjs.com/package/snappyjs
5. https://www.npmjs.com/package/config
