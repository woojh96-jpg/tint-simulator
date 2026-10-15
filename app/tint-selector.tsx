import { FILMS, type FilmId, type TintZone } from "./film-presets";

type TintSelectorProps = {
  zone: TintZone;
  label: string;
  englishLabel: string;
  filmId: FilmId;
  vlt: number;
  onChange: (value: number) => void;
};

export default function TintSelector({ zone, label, englishLabel, filmId, vlt, onChange }: TintSelectorProps) {
  return (
    <fieldset className="tint-selector" data-zone={zone}>
      <legend><span className="zone-title">{label}<small>{englishLabel}</small></span><span className="zone-vlt">현재 VLT <strong>{vlt}<small>%</small></strong></span></legend>
      <div className="tint-options">
        {FILMS[filmId].availableVlts.map((value) => <label key={value} className="tint-option"><input type="radio" name={`vlt-${zone}`} value={value} checked={vlt === value} onChange={() => onChange(value)} aria-label={`${label} VLT ${value}%`} /><span>{value}<small>%</small></span></label>)}
      </div>
    </fieldset>
  );
}
