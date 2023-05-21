![Logo](https://github.com/senator715/SXIS/assets/89423559/bc819c80-d0e8-4ce0-bf89-f1461432abc4)
[![CodeQL](https://github.com/senator715/SXIS/actions/workflows/codeql.yml/badge.svg)](https://github.com/senator715/SXIS/actions/workflows/codeql.yml)
#
SXIS provides a comprehensive solution written in JavaScript using NodeJS that eliminates the need for third-party ShareX providers. With SXIS, you can set up your server to share images, videos, and files securely and privately.
# Why SXIS?
1. Supports ShareX, allowing you to easily share images, text documents, clipboard text, files, and more.
1. Uses a unique approach to privacy by encrypting the files stored on the server with AES 128/196/256; Only the person with the decryption key embedded in the link can view the contents; this also provides a bulletproof solution to theft by making it impossible for hackers to compromise your server and steal all of your sensitive files.
2. Includes lossless compression.
3. The ability to automatically delete uploaded files after a specific time frame.

> **Note**
> At the moment, SXIS does not have the capability to compress or encrypt MP3/MP4 files during streaming. Nevertheless, MP3/MP4 file uploads and streaming functionality continue to operate without any issues.
# Installation
1. To get started, simply choose where you want to place SXIS – on your computer or server.
2. It is **essential** to open config/default.json and adjust the settings to your individual use case.
3. Navigate to the folder location via your terminal.
4. Type `npm run sxis`

> **Warning**
> It is **crucial** that you modify your config/default.json configuration file; you *MUST* change your API key or anyone could upload files to your server.

To enable verbose debugging text, Follow the information displayed in the terminal. SXIS should already be running.
# Dependencies used
1. https://nodejs.org
1. https://www.npmjs.com/package/aes-js
2. https://www.npmjs.com/package/debug
3. https://www.npmjs.com/package/mime-types
4. https://www.npmjs.com/package/snappyjs
5. https://www.npmjs.com/package/config
6. https://www.npmjs.com/package/is-ci
