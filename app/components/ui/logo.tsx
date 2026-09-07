"use client"

import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link 
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Image
        src="/winkmail-logo.png"
        alt="WinkMail Logo"
        width={32}
        height={32}
        className="object-contain"
      />
      <span className="font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
        WinkMail
      </span>
    </Link>
  )
}