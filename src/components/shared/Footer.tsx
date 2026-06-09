interface FooterProps {
  dark?: boolean
  text?: string
}

export default function Footer({ dark = false, text = '© 2024 VBSite. 用 ❤️ 打造每一页。' }: FooterProps) {
  return (
    <footer className={`py-8 text-center text-sm ${dark ? 'text-stone-600 border-t border-white/5' : 'text-stone-400'}`}>
      <p>{text}</p>
    </footer>
  )
}
