'use client';

import {ReactNode, useEffect, useState} from "react";
import "../neko/assets/css/neko.css";
import hexItems from "./assets/modsList.json";
import { useTooltip } from "./assets/tooltips";
import { useModalHandler } from "./assets/modalHandler";
import { Modal } from "./assets/modal";

function isDivisibleByThree(n: number): string {
  return n % 3 === 0 ? "true" : "false";
}

export default function ModsPage() {

  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTooltip();
  const { isOpen, isVisible, activeItem, openModal, closeModal } = useModalHandler();

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 raya-container">
        <h1 className={"text-center"}>My FFXIV Mods</h1>
        <div className={"flex flex-col gap-4 mt-8 cute-border"}>
          <a className={"back-to-front"} href={"/"}> &lt;-- Back to front page</a>
          <div className={"hex-container"}>
            {hexItems.reduce<{ title: string; description: string; image: string; alt: string; link: string }[][]>(
              (rows, item, index) => {
                if (index % 3 === 0) rows.push([]);
                rows[rows.length - 1].push(item);
                return rows;
              }, []
            ).map((row, rowIndex) => (
              <div className={"row"} key={rowIndex}>
                {row.map((item, index) => (
                  <div
                    className={"hex-item"}
                    key={index}
                  >
                    <a
                      onMouseEnter={(e) => showTooltip(item.title, item.alt, e)}
                      onMouseMove={moveTooltip}
                      onMouseLeave={hideTooltip}
                      onClick={(e)  => {
                        e.preventDefault();
                        openModal(item);
                      }}
                    >
                      <img srcSet={item.image} alt={item.alt} />
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`social-hover-popup ${tooltip.visible ? 'visible' : ''}`}
        style={{
          left: tooltip.x + 18,
          top: tooltip.y + 18,
        }}
      >
        <h3>{tooltip.title}</h3>
        <p>{tooltip.text}</p>
      </div>

      <Modal isOpen={isOpen} isVisible={isVisible} activeItem={activeItem} onClose={closeModal} />
    </>
  )
}