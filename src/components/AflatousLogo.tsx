/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AflatousLogoProps {
  className?: string;
  size?: number;
}

export default function AflatousLogo({ className = '', size = 40 }: AflatousLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Left main leaf - Left side (brighter green gradient) */}
        <linearGradient id="leftLeafBright" x1="20" y1="25" x2="60" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E8A58" />
          <stop offset="50%" stopColor="#137447" />
          <stop offset="100%" stopColor="#0B5F3C" />
        </linearGradient>

        {/* Left main leaf - Right side (darker shadow green gradient) */}
        <linearGradient id="leftLeafDark" x1="30" y1="25" x2="60" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#126B42" />
          <stop offset="100%" stopColor="#064027" />
        </linearGradient>

        {/* Right curved stroke (medium emerald green gradient) */}
        <linearGradient id="rightCurveGrad" x1="40" y1="30" x2="80" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E8A58" />
          <stop offset="50%" stopColor="#116D43" />
          <stop offset="100%" stopColor="#08472B" />
        </linearGradient>

        {/* Gold Star Gradient */}
        <linearGradient id="goldStar" x1="50" y1="5" x2="70" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5C185" />
          <stop offset="50%" stopColor="#C5A880" />
          <stop offset="100%" stopColor="#A88B60" />
        </linearGradient>
      </defs>

      {/* Main Left Leaf - Left Side (Outer curve to Central Vein) */}
      <path
        d="M 60,110 
           C 42,103 26,84 20,64 
           C 14,46 20,28 35,18 
           C 36,17 37,17.5 36.5,19.5 
           C 31,38 35.5,64 50.5,85 
           C 54,90 57.5,94 60,110 Z"
        fill="url(#leftLeafBright)"
      />

      {/* Main Left Leaf - Right Side (Central Vein to Inner Curve) */}
      <path
        d="M 60,110 
           C 57.5,94 54,90 50.5,85 
           C 35.5,64 31,38 36.5,19.5 
           C 37,18 38,18 39,19.5 
           C 45,30 52,48 56,66 
           C 59.5,81 60.5,96 60,110 Z"
        fill="url(#leftLeafDark)"
      />

      {/* Right Curved Leaf/S-Stroke */}
      <path
        d="M 70,92 
           C 78,78 81,60 73,46 
           C 66,35 56,28 52,26 
           C 53,30 55,37 59,44 
           C 65,55 67.5,70 59.5,84 
           C 63.5,87 67,90 70,92 Z"
        fill="url(#rightCurveGrad)"
      />

      {/* Gold Star (Four-point sparkle) on Top-Right */}
      <path
        d="M 60,8 
           Q 60,20 48,20 
           Q 60,20 60,32 
           Q 60,20 72,20 
           Q 60,20 60,8 Z"
        fill="url(#goldStar)"
      />
    </svg>
  );
}
