"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type SVGProps } from "react";
import type { CameraView } from "./car-scene";
import {
  DEFAULT_FILM_ID,
  DEFAULT_TINTS,
  FILMS,
  TINT_ZONES,
  reconcileTintSettings,
  type FilmId,
  type TintSettings,
  type TintZone,
} from "./film-presets";
import TintSelector from "./tint-selector";

const CarScene = dynamic(() => import("./car-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading" role="status"><span className="loading-ring" />스튜디오를 준비하고 있습니다</div>,
});
const FILM_IDS: FilmId[] = ["royal101", "royal701", "royal901", "royal801"];
const CAMERA_PRESETS: { name: CameraView; label: string }[] = [
  { name: "perspective", label: "외부 3D" },
  { name: "front", label: "정면" },
  { name: "side", label: "측면" },
  { name: "interior", label: "실내" },
];

function Icon({ name, ...props }: SVGProps<SVGSVGElement> & {
  name: "arrow" | "rotate" | "info" | "close" | "check";
}) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    rotate: <path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export default function Home() {
  const [configuration, setConfiguration] = useState<{
    filmId: FilmId;
    tints: TintSettings;
    announcement: string;
  }>({ filmId: DEFAULT_FILM_ID, tints: { ...DEFAULT_TINTS }, announcement: "" });
  const [view, setView] = useState<{ name: CameraView; revision: number }>({ name: "perspective", revision: 0 });
  const guide = useRef<HTMLDialogElement>(null);
  const { filmId, tints } = configuration;
  const film = FILMS[filmId];
  const interior = view.name === "interior";
  const tintSummary = TINT_ZONES.map((zone) => `${zone.label} ${tints[zone.id]}%`).join(", ");

  function changeView(name: CameraView) {
    setView((current) => ({ name, revision: current.revision + 1 }));
  }

  function changeFilm(nextFilmId: FilmId) {
    setConfiguration((current) => {
      const nextTints = reconcileTintSettings(current.tints, nextFilmId);
      const adjusted = TINT_ZONES.filter((zone) => nextTints[zone.id] !== current.tints[zone.id]);
      return {
        filmId: nextFilmId,
        tints: nextTints,
        announcement: adjusted.length
          ? `${FILMS[nextFilmId].name} 선택. ${adjusted.map((zone) => `${zone.label} ${nextTints[zone.id]}%`).join(", ")}로 가장 가까운 농도를 적용했습니다.`
          : `${FILMS[nextFilmId].name} 선택. 각 구역의 농도를 유지했습니다.`,
      };
    });
  }

  function changeTint(zone: TintZone, vlt: number) {
    setConfiguration((current) => ({ ...current, tints: { ...current.tints, [zone]: vlt }, announcement: "" }));
  }

  function resetConfiguration() {
    setConfiguration({
      filmId: DEFAULT_FILM_ID,
      tints: { ...DEFAULT_TINTS },
      announcement: "Royal 101, 전면 35%, 측면 1열·2열과 후면 15%로 초기화했습니다.",
    });
    changeView("perspective");
  }

  return (
    <div className="studio-shell">
      <header className="studio-header flex items-center justify-between">
        <a href="#simulator" className="brand" aria-label="틴트 스튜디오 홈"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>TINT<span className="brand-light">STUDIO</span><span className="brand-period">.</span></a>
        <nav aria-label="주 메뉴" className="header-nav flex items-center">
          <a href="#simulator" className="nav-active">시뮬레이터</a>
          <button type="button" onClick={() => guide.current?.showModal()}>이용 가이드 <span aria-hidden="true">↗</span></button>
        </nav>
        <span className="edition">A NEW PERSPECTIVE ON LIGHT</span>
      </header>

      <main id="simulator" className="simulator-grid">
        <section id="preview" className={`car-stage${interior ? " interior-stage" : ""}`} aria-label="자동차 3D 미리보기" tabIndex={-1}>
          <div className="stage-heading">
            <p className="eyebrow">LIGHT. SHADE. YOUR SIGNATURE.</p>
            <h1>빛을 조절하다.<br />분위기를 완성하다.</h1>
            <p className="stage-description">유리마다 다른 빛의 깊이.<br className="mobile-break" /> 안과 밖, 두 시선으로 비교해 보세요.</p>
          </div>
          <div className="live-indicator"><span /> LIVE 3D</div>
          <div className="vehicle-viewport" role="group" aria-label={`${film.name}. ${tintSummary}. ${interior ? "운전석에서 전면과 측면 1열 유리를 바라보는 고정 시점입니다." : "마우스나 터치로 회전하거나 아래 시점 버튼을 사용하세요."}`}>
            <CarScene filmId={filmId} tints={tints} view={view.name} viewRevision={view.revision} />
          </div>
          <div className="stage-controls">
            <div className="view-presets" role="group" aria-label="자동차 시점 선택">
              {CAMERA_PRESETS.map((preset) => <button key={preset.name} type="button" aria-pressed={view.name === preset.name} onClick={() => changeView(preset.name)}>{preset.label}</button>)}
              <button type="button" className="reset-view" onClick={() => changeView("perspective")} aria-label="외부 3D 시점으로 초기화" title="시점 초기화"><Icon name="rotate" width="16" height="16" /></button>
            </div>
            <p className="orbit-hint"><Icon name={interior ? "info" : "rotate"} width="14" height="14" />{interior ? "운전석 고정 시점 · 유리 너머의 빛을 비교하세요" : "드래그하여 회전 · 스크롤하여 확대"}</p>
          </div>
          <div className="stage-bottom">
            <div className="model-info"><p className="model-eyebrow">THE STUDIO COLLECTION</p><p className="model-name">Concept Sedan <span>01</span></p><p className="model-detail"><span className="paint-swatch" /> 실버 메탈릭 <span className="detail-divider">/</span> 프로토타입</p></div>
            <div className="glass-legend">
              <p className="legend-product"><span className="film-swatch" style={{ backgroundColor: film.color }} />{film.name}<span className="legend-view">{interior ? "INTERIOR" : "EXTERIOR"}</span></p>
              <dl>{TINT_ZONES.map((zone) => <div key={zone.id}><dt>{zone.label}</dt><dd>{tints[zone.id]}<small>%</small></dd></div>)}</dl>
            </div>
          </div>
        </section>

        <aside id="configuration" className="config-panel" aria-labelledby="config-title">
          <div className="panel-topline"><span>PERSONALIZE YOUR DRIVE</span><span>ROYAL COLLECTION</span></div>
          <div className="panel-heading"><p className="eyebrow">TINT CONFIGURATOR</p><h2 id="config-title">당신만의 빛을 찾아보세요.</h2><p>제품의 색감부터 유리별 농도까지,<br />선택하는 순간 미리보기에 반영됩니다.</p></div>
          <fieldset className="film-selector">
            <legend>제품 선택 <span>01 / FILM</span></legend>
            <div className="film-options">
              {FILM_IDS.map((id) => <label key={id} className="film-option"><input type="radio" name="film" value={id} checked={filmId === id} onChange={() => changeFilm(id)} /><span className="film-card"><span className="film-card-title"><span className="film-swatch" style={{ backgroundColor: FILMS[id].color }} /><strong>{FILMS[id].name}</strong><span className="film-check"><Icon name="check" width="13" height="13" /></span></span><span className="film-type">{FILMS[id].type}</span></span></label>)}
            </div>
            <p className="film-selection-note">선택 제품 <strong>{film.name}</strong><span> · {film.type}</span></p>
          </fieldset>
          <div className="zones-heading"><h3>유리별 농도</h3><span>02 / VLT</span></div>
          <p className="zones-description">좌우 측면 유리는 같은 농도가 적용됩니다.</p>
          <div className="zone-selectors">
            {TINT_ZONES.map((zone) => <TintSelector key={zone.id} zone={zone.id} label={zone.label} englishLabel={zone.englishLabel} filmId={filmId} vlt={tints[zone.id]} onChange={(value) => changeTint(zone.id, value)} />)}
          </div>
          <p className="selection-announcement" role="status" aria-live="polite" aria-atomic="true">{configuration.announcement}</p>
          <div className="vlt-note"><Icon name="info" width="16" height="16" /><p>VLT는 가시광선 투과율입니다. 숫자가 낮을수록 어두워집니다. 제품 변경 시 가장 가까운 농도로 자동 조정됩니다.</p></div>
          <div className="configuration-summary"><p className="applied-status"><Icon name="check" width="15" height="15" /> 미리보기에 실시간 반영 중</p><span>LIVE PREVIEW</span></div>
          <a href="#preview" className="preview-link">3D 미리보기로 이동 <Icon name="arrow" width="16" height="16" /></a>
          <button type="button" className="restore-button flex items-center justify-between" onClick={resetConfiguration}>기본 설정으로 되돌리기 <Icon name="rotate" width="16" height="16" /></button>
          <p className="prototype-note">화면의 색감과 투과율은 시각적 참고용이며,<br />실제 시공 결과와 차이가 있을 수 있습니다.</p>
        </aside>
      </main>

      <footer className="studio-footer flex items-center justify-between"><p>DESIGNED AROUND YOUR PERSPECTIVE.</p><p><span className="footer-dot" /> 3D TINT EXPERIENCE <span className="footer-version">BETA 02</span></p></footer>
      <dialog ref={guide} className="guide-dialog" aria-labelledby="guide-title" onClick={(event) => { if (event.target === event.currentTarget) guide.current?.close(); }}>
        <div className="guide-content">
          <button type="button" className="guide-close" onClick={() => guide.current?.close()} aria-label="이용 가이드 닫기"><Icon name="close" /></button>
          <p className="eyebrow">A LITTLE GUIDANCE</p><h2 id="guide-title">새로운 시선을 경험하는 방법</h2>
          <ol>
            <li><strong>안과 밖에서 둘러보세요.</strong><p>외부에서는 드래그해 자동차를 회전하고 휠 또는 두 손가락으로 확대할 수 있습니다. 정면·측면 버튼으로 시점을 바꾸고, 실내 버튼으로 운전석에서 유리 너머를 확인하세요. 실내는 고정 시점입니다.</p></li>
            <li><strong>제품과 네 구역의 농도를 고르세요.</strong><p>Royal 제품별로 제공되는 농도가 다릅니다. 전면, 측면 1열, 측면 2열, 후면을 각각 설정할 수 있고, 좌우 측면에는 같은 값이 적용됩니다. 제품을 바꾸면 기존 값과 가장 가까운 농도가 적용됩니다.</p></li>
            <li><strong>빛의 차이를 비교하세요.</strong><p>VLT가 낮을수록 외부가 어둡게 보입니다. 반사와 색감은 제품과 시점에 따라 달라집니다. 기본 설정은 Royal 101, 전면 35%, 측면 1열·2열과 후면 15%입니다.</p></li>
          </ol>
          <button type="button" className="guide-confirm" onClick={() => guide.current?.close()}>시뮬레이션 시작하기 <Icon name="arrow" width="18" height="18" /></button>
        </div>
      </dialog>
    </div>
  );
}
