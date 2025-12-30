import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        fontFamily: "'Montserrat', sans-serif"
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://www.discovercanadatours.com/wp-content/uploads/2022/10/WesternCanadaPremiumSummerTour61.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Green Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(45, 70, 41, 0.85) 0%, rgba(232, 220, 200, 0.75) 100%)'
        }}
      />
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');

          @font-face {
            font-family: 'The Seasons';
            src: url('/src/fonts/The-Seasons-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }

          .login-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .heading-font {
            font-family: 'The Seasons', serif;
            letter-spacing: 0.01em;
          }
        `}
      </style>

      <div className=" w-full max-w-md rounded-3xl p-8 relative z-20">
        {/* Logo */}

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: {
                  background: 'linear-gradient(135deg, #2D4629 0%, #243A20 100%)',
                  color: 'white',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.125rem',
                  letterSpacing: '0.05em'
                },
                card: {
                  boxShadow: 'none',
                  border: 'none'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
