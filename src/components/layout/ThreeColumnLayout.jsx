import './layout.css'

export default function ThreeColumnLayout({ left, main, right }) {
  return (
    <div className="three-col-wrapper">
      <div className="three-col-left">{left}</div>
      <div className="three-col-main">{main}</div>
      <div className="three-col-right">{right}</div>
    </div>
  )
}
