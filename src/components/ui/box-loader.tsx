"use client";

import React from 'react';

const BoxLoader = () => {
  const loaderCss = `
    .box-loader {
      --duration: 3s;
      --primary: #141414;
      --primary-light: #333333;
      --primary-rgba: rgba(20, 20, 20, 0);
      --mask-bg: var(--background, #ffffff);
      width: 200px;
      height: 320px;
      position: relative;
      transform-style: preserve-3d;
    }

    :root.dark .box-loader,
    .dark .box-loader {
      --primary: #F5F5F5;
      --primary-light: #cccccc;
      --primary-rgba: rgba(245, 245, 245, 0);
    }

    @media (max-width: 480px) {
      .box-loader { zoom: 0.44; }
    }

    .box-loader:before, .box-loader:after {
      --r: 20.5deg;
      content: "";
      width: 320px;
      height: 140px;
      position: absolute;
      right: 32%;
      bottom: -11px;
      background: var(--mask-bg);
      transform: translateZ(200px) rotate(var(--r));
      animation: bl-mask var(--duration) linear forwards infinite;
    }
    .box-loader:after {
      --r: -20.5deg;
      right: auto;
      left: 32%;
    }

    .box-loader .bl-ground {
      position: absolute;
      left: -50px;
      bottom: -120px;
      transform-style: preserve-3d;
      transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1);
    }
    .box-loader .bl-ground div {
      transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0);
      width: 200px;
      height: 200px;
      background: linear-gradient(45deg, var(--primary) 0%, var(--primary) 50%, var(--primary-light) 50%, var(--primary-light) 100%);
      transform-style: preserve-3d;
      animation: bl-ground var(--duration) linear forwards infinite;
    }
    .box-loader .bl-ground div:before, .box-loader .bl-ground div:after {
      --rx: 90deg; --ry: 0deg; --x: 44px; --y: 162px; --z: -50px;
      content: "";
      width: 156px;
      height: 300px;
      opacity: 0;
      background: linear-gradient(var(--primary), var(--primary-rgba));
      position: absolute;
      transform: rotateX(var(--rx)) rotateY(var(--ry)) translate(var(--x), var(--y)) translateZ(var(--z));
      animation: bl-ground-shine var(--duration) linear forwards infinite;
    }
    .box-loader .bl-ground div:after {
      --rx: 90deg; --ry: 90deg; --x: 0; --y: 177px; --z: 150px;
    }

    .box-loader .bl-box {
      --x: 0; --y: 0;
      position: absolute;
      animation: var(--duration) linear forwards infinite;
      transform: translate(var(--x), var(--y));
    }
    .box-loader .bl-box div {
      background-color: var(--primary);
      width: 48px;
      height: 48px;
      position: relative;
      transform-style: preserve-3d;
      animation: var(--duration) ease forwards infinite;
      transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0);
    }
    .box-loader .bl-box div:before, .box-loader .bl-box div:after {
      --rx: 90deg; --ry: 0deg; --z: 24px; --y: -24px; --x: 0;
      content: "";
      position: absolute;
      background-color: inherit;
      width: inherit;
      height: inherit;
      transform: rotateX(var(--rx)) rotateY(var(--ry)) translate(var(--x), var(--y)) translateZ(var(--z));
      filter: brightness(var(--b, 1.2));
    }
    .box-loader .bl-box div:after {
      --rx: 0deg; --ry: 90deg; --x: 24px; --y: 0; --b: 1.4;
    }

    .box-loader .bl-box.bl-box0 { --x: -220px; --y: -120px; left: 58px; top: 108px; animation-name: bl-move0; }
    .box-loader .bl-box.bl-box0 div { animation-name: bl-scale0; }
    .box-loader .bl-box.bl-box1 { --x: -260px; --y: 120px; left: 25px; top: 120px; animation-name: bl-move1; }
    .box-loader .bl-box.bl-box1 div { animation-name: bl-scale1; }
    .box-loader .bl-box.bl-box2 { --x: 120px; --y: -190px; left: 58px; top: 64px; animation-name: bl-move2; }
    .box-loader .bl-box.bl-box2 div { animation-name: bl-scale2; }
    .box-loader .bl-box.bl-box3 { --x: 280px; --y: -40px; left: 91px; top: 120px; animation-name: bl-move3; }
    .box-loader .bl-box.bl-box3 div { animation-name: bl-scale3; }
    .box-loader .bl-box.bl-box4 { --x: 60px; --y: 200px; left: 58px; top: 132px; animation-name: bl-move4; }
    .box-loader .bl-box.bl-box4 div { animation-name: bl-scale4; }
    .box-loader .bl-box.bl-box5 { --x: -220px; --y: -120px; left: 25px; top: 76px; animation-name: bl-move5; }
    .box-loader .bl-box.bl-box5 div { animation-name: bl-scale5; }
    .box-loader .bl-box.bl-box6 { --x: -260px; --y: 120px; left: 91px; top: 76px; animation-name: bl-move6; }
    .box-loader .bl-box.bl-box6 div { animation-name: bl-scale6; }
    .box-loader .bl-box.bl-box7 { --x: -240px; --y: 200px; left: 58px; top: 87px; animation-name: bl-move7; }
    .box-loader .bl-box.bl-box7 div { animation-name: bl-scale7; }

    @keyframes bl-move0 { 12% { transform: translate(var(--x), var(--y)); } 25%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale0 { 6% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 14%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move1 { 16% { transform: translate(var(--x), var(--y)); } 29%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale1 { 10% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 18%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move2 { 20% { transform: translate(var(--x), var(--y)); } 33%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale2 { 14% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 22%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move3 { 24% { transform: translate(var(--x), var(--y)); } 37%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale3 { 18% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 26%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move4 { 28% { transform: translate(var(--x), var(--y)); } 41%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale4 { 22% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 30%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move5 { 32% { transform: translate(var(--x), var(--y)); } 45%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale5 { 26% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 34%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move6 { 36% { transform: translate(var(--x), var(--y)); } 49%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale6 { 30% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 38%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
    @keyframes bl-move7 { 40% { transform: translate(var(--x), var(--y)); } 53%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
    @keyframes bl-scale7 { 34% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 42%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }

    @keyframes bl-ground { 0%, 65% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0); } 75%, 90% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(1); } 100% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0); } }
    @keyframes bl-ground-shine { 0%, 70% { opacity: 0; } 75%, 87% { opacity: 0.2; } 100% { opacity: 0; } }
    @keyframes bl-mask { 0%, 65% { opacity: 0; } 66%, 100% { opacity: 1; } }
  `;

  const boxes = [...Array(8).keys()];

  return (
    <>
      <style>{loaderCss}</style>
      <div className="box-loader">
        {boxes.map(i => (
          <div key={i} className={`bl-box bl-box${i}`}>
            <div></div>
          </div>
        ))}
        <div className="bl-ground">
          <div></div>
        </div>
      </div>
    </>
  );
};

export default BoxLoader;
