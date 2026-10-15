"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type CSSProperties, type SVGProps } from "react";
import type { CameraView } from "./car-scene";

const CarScene = dynamic(() => import("./car-scene"), {
  ssr: false,
  loading: () => <div className="scene-loading" role="status"><span className="loading-ring" />스튜디오를 준비하고 있습니다</div>,
});
const TINT_OPTIONS = [5, 15, 30, 50, 70] as const;
const TINT_DESCRIPTIONS: Record<number, string> = {
  5: "깊고 짙은 톤으로, 가장 어두운 분위기",
  15: "차분한 실루엣이 돋보이는 짙은 톤",
  30: "선명함과 차분함 사이, 균형 잡힌 톤",
  50: "은은한 색감으로 완성하는 밝은 시야",
  70: "자연스러운 투명함, 가장 밝은 분위기",
};

function Icon({ name, ...props }: SVGProps<SVGSVGElement> & {
  name: "arrow" | "rotate" | "glass" | "info" | "sun" | "close" | "check";
}) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    rotate: <path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6" />,
    glass: <><path d="m6 5-3 14h18L18 5H6Z" /><path d="m9 8-1 5m5-5-1 8" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export default function Home() {
  const [vlt, setVlt] = useState<number>(30);
  const [view, setView] = useState<{ name: CameraView; revision: number }>({ name: "perspective", revision: 0 });
  const guide = useRef<HTMLDialogElement>(null);

  function changeView(name: CameraView) {
    setView((current) => ({ name, revision: current.revision + 1 }));
  }

  return (
    <div className="studio-shell">
      <header className="studio-header flex items-center justify-between">
        <a href="#" className="brand" aria-label="틴트 스튜디오 홈"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>TINT<span className="brand-light">STUDIO</span><span className="brand-period">.</span></a>
        <nav aria-label="주 메뉴" className="header-nav flex items-center">
          <a href="#simulator" className="nav-active">시뮬레이터</a>
          <button type="button" onClick={() => guide.current?.showModal()}>이용 가이드 <span aria-hidden="true">↗</span></button>
        </nav>
        <span className="edition">A NEW PERSPECTIVE ON LIGHT</span>
      </header>

      <main id="simulator" className="simulator-grid">
        <section className="car-stage" aria-label="자동차 3D 미리보기">
          <div className="stage-heading">
            <p className="eyebrow">LIGHT. SHADE. YOUR SIGNATURE.</p>
            <h1>빛을 조절하다.<br />분위기를 완성하다.</h1>
            <p className="stage-description">당신의 취향에 맞는 썬팅,<br className="mobile-break" /> 새로운 시선으로 경험해 보세요.</p>
          </div>
          <div className="live-indicator"><span /> LIVE 3D</div>
          <div className="vehicle-viewport" role="group" aria-label={`회전 가능한 실버 세단. 전면 유리 VLT ${vlt}%. 마우스나 터치로 회전하거나 아래 시점 버튼을 사용하세요.`}>
            <CarScene vlt={vlt} view={view.name} viewRevision={view.revision} />
          </div>
          <div className="stage-controls">
            <div className="view-presets" aria-label="자동차 시점 선택">
              <button type="button" onClick={() => changeView("front")}>정면</button><span aria-hidden="true" />
              <button type="button" onClick={() => changeView("side")}>측면</button>
              <button type="button" className="reset-view" onClick={() => changeView("perspective")} aria-label="시점 초기화" title="시점 초기화"><Icon name="rotate" width="16" height="16" /></button>
            </div>
            <p className="orbit-hint"><Icon name="rotate" width="14" height="14" /> 드래그하여 자유롭게 둘러보세요</p>
          </div>
          <div className="stage-bottom flex items-end justify-between">
            <div><p className="model-eyebrow">THE STUDIO COLLECTION</p><p className="model-name">Concept Sedan <span>01</span></p><p className="model-detail"><span className="paint-swatch" /> 실버 메탈릭 <span className="detail-divider">/</span> 프로토타입</p></div>
            <div className="glass-legend"><span /> 전면 유리 <strong>VLT {vlt}%</strong></div>
          </div>
        </section>

        <aside id="configuration" className="config-panel" aria-labelledby="config-title">
          <div className="panel-topline"><span>PERSONALIZE YOUR DRIVE</span><span>01 — 01</span></div>
          <div className="panel-heading"><p className="eyebrow">TINT CONFIGURATOR</p><h2 id="config-title">당신만의 농도를 찾아보세요.</h2><p>작은 차이가 만드는 새로운 분위기.<br />유리의 농도를 선택하고 직접 확인하세요.</p></div>
          <div className="selected-glass flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="glass-icon"><Icon name="glass" width="25" height="25" /></span><div><h3>전면 유리</h3><p>FRONT WINDSHIELD</p></div></div>
            <span className="selected-badge"><span /> 선택됨</span>
          </div>
          <div className="vlt-display" aria-live="polite" aria-atomic="true"><p className="vlt-label">현재 VLT <span>가시광선 투과율</span></p><p className="vlt-number">{vlt}<span>%</span></p><p className="vlt-description">{TINT_DESCRIPTIONS[vlt]}</p></div>
          <fieldset className="tint-selector">
            <legend>썬팅 농도 선택</legend>
            <div className="tint-options grid grid-cols-5 gap-2">
              {TINT_OPTIONS.map((value) => <label key={value} className="tint-option"><input type="radio" name="vlt" value={value} checked={vlt === value} onChange={() => setVlt(value)} aria-label={`전면 유리 VLT ${value}%`} /><span>{value}<small>%</small></span></label>)}
            </div>
            <div className="shade-scale" aria-hidden="true"><span className="shade-marker" style={{ "--shade-position": `${((vlt - 5) / 65) * 100}%` } as CSSProperties} /></div>
            <div className="scale-labels"><span>더 어둡게</span><span>더 밝게 <Icon name="sun" width="13" height="13" /></span></div>
          </fieldset>
          <div className="vlt-note"><Icon name="info" width="17" height="17" /><p>VLT는 빛이 유리를 통과하는 비율입니다.<br />숫자가 낮을수록 유리가 더 어둡게 보입니다.</p></div>
          <div className="configuration-summary"><p className="applied-status"><Icon name="check" width="15" height="15" /> 미리보기에 실시간 반영 중</p><span>LIVE PREVIEW</span></div>
          <button type="button" className="restore-button flex items-center justify-between" onClick={() => { setVlt(30); changeView("perspective"); }}>기본 설정으로 되돌리기 <Icon name="rotate" width="16" height="16" /></button>
          <p className="prototype-note">화면의 색감과 투과율은 시각적 참고용이며,<br />실제 시공 결과와 차이가 있을 수 있습니다.</p>
        </aside>
      </main>

      <footer className="studio-footer flex items-center justify-between"><p>DESIGNED AROUND YOUR PERSPECTIVE.</p><p><span className="footer-dot" /> 3D TINT EXPERIENCE <span className="footer-version">BETA 01</span></p></footer>
      <dialog ref={guide} className="guide-dialog" aria-labelledby="guide-title" onClick={(event) => { if (event.target === event.currentTarget) guide.current?.close(); }}>
        <div className="guide-content">
          <button type="button" className="guide-close" onClick={() => guide.current?.close()} aria-label="이용 가이드 닫기"><Icon name="close" /></button>
          <p className="eyebrow">A LITTLE GUIDANCE</p><h2 id="guide-title">새로운 시선을 경험하는 방법</h2>
          <ol><li><strong>자동차를 둘러보세요.</strong><p>마우스나 손가락으로 드래그해 회전하고, 휠 또는 두 손가락으로 확대해 보세요. 정면·측면 버튼으로 시점을 바꿀 수도 있습니다.</p></li><li><strong>빛의 양을 선택하세요.</strong><p>5%부터 70%까지 원하는 VLT를 선택하면 전면 유리의 어두움이 바로 바뀝니다. 측면과 후면 유리는 고정되어 있습니다.</p></li><li><strong>변화를 비교하세요.</strong><p>숫자가 작을수록 어둡고, 클수록 투명해집니다. 기본 설정 버튼을 누르면 VLT 30%와 처음 시점으로 돌아갑니다.</p></li></ol>
          <button type="button" className="guide-confirm" onClick={() => guide.current?.close()}>시뮬레이션 시작하기 <Icon name="arrow" width="18" height="18" /></button>
        </div>
      </dialog>
    </div>
  );
}
