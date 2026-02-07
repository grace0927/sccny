"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "https://www.scc-ny.org/wp-content/uploads/2021/10/IMG_2305.jpeg",
  "https://www.scc-ny.org/wp-content/uploads/2018/11/FB382E7C-5FB5-4ABC-B4CA-98E2AF1ACEA2-627-0000009106E91CD2_tmp-1.jpeg",
  "https://www.scc-ny.org/wp-content/uploads/2018/10/IMG_0695.jpeg",
  "https://www.scc-ny.org/wp-content/uploads/2012/05/campus940x340.jpg",
  "https://www.scc-ny.org/wp-content/uploads/2018/11/DSC_0487.jpeg",
  "https://www.scc-ny.org/wp-content/uploads/2018/12/IMG_2640-3.jpeg",
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {images.map((src, index) => (
        <div
          key={src}
          className={`relative w-full ${
            index === currentIndex ? "" : "hidden"
          }`}
        >
          <Image
            src={src}
            alt={`Slide ${index + 1}`}
            width={940}
            height={340}
            className="w-full"
            unoptimized
          />
        </div>
      ))}
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-card/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
