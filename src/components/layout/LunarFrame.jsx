import './lunar-frame.css'

export default function LunarFrame({ children }) {
  return (
    <div className="ls-outer-frame">
      <a className="ls-collapse-arrow" href="#">«</a>
      {children}
    </div>
  )
}
