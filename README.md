🛠️ Project Setup Instructions
This repo includes:

Laravel backend (/backend)

React Native frontend (/frontend)

Follow these steps to install and run everything locally.

📦 Global Prerequisites
Install the following if you don't already have them:

Node.js (LTS)

PHP >= 8.1

Composer

MySQL / XAMPP

Git

Java JDK (17+)

Android Studio (for SDK, AVD, adb)

📂 Backend Setup (Laravel)
bash
Copy
Edit
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
Make sure MySQL is running and your .env DB credentials are correct.

Backend will run at:

cpp
Copy
Edit
http://127.0.0.1:8000
📱 Frontend Setup (React Native)
bash
Copy
Edit
cd frontend
npm install
Start the Metro bundler:

bash
Copy
Edit
npx react-native start
In another terminal, run the app:

bash
Copy
Edit
npx react-native run-android
Emulator must be running or physical device connected with USB debugging enabled.

🧪 Ping Test
Open the app and check logs:

If connection to the Laravel API is working, you’ll see:

css
Copy
Edit
✅ { message: 'pong' }
💡 Notes
Use http://10.0.2.2:8000 in frontend API when testing on Android emulator.

If running on real device, use your local IP (e.g., 192.168.x.x:8000)

Metro must be running while the app is open

