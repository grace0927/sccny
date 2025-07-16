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
    <div className="carousel w-full">
      {images.map((src, index) => (
        <div
          key={src}
          className={`carousel-item relative w-full ${
            index === currentIndex ? "" : "hidden"
          }`}
        >
          <Image
            src={src}
            alt={`Slide ${index + 1}`}
            width={940}
            height={340}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
