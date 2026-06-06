import Link from "next/link";
import { GraduationCap, Facebook, Instagram, Youtube, MessageCircle } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="fi2">
        <div className="ft">
          <div className="fb">
            <Link href="/" className="flex items-center gap-3" aria-label="MDCAT Prep home">
              <span className="logo-box">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span>
                <span className="logo-w1 block font-display" style={{ color: "#fff" }}>
                  MDCAT
                </span>
                <span className="logo-w2 block" style={{ color: "#93b4ff" }}>
                  Preparation
                </span>
              </span>
            </Link>
            <p>
              A focused MDCAT preparation platform for Pakistan — built around a
              real MCQ bank, timed mock tests, and past papers.
            </p>
            <ul className="fcontact">
              <li>
                <a href="mailto:theelitepreparations@gmail.com">
                  theelitepreparations@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/923248905884"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: 0324 8905884
                </a>
              </li>
              <li>Support hours: Mon–Sun, 9 AM – 11 PM</li>
            </ul>
            <div className="soc2">
              <a className="sb2" href="#" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a className="sb2" href="#" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a className="sb2" href="#" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
              <a
                className="sb2"
                href="https://wa.me/923248905884"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="fcol">
            <h4>Subjects</h4>
            <ul>
              <li><Link href="/subjects/biology">Biology</Link></li>
              <li><Link href="/subjects/chemistry">Chemistry</Link></li>
              <li><Link href="/subjects/physics">Physics</Link></li>
              <li><Link href="/subjects/english">English</Link></li>
              <li><Link href="/subjects/logical-reasoning">Logical Reasoning</Link></li>
            </ul>
          </div>

          <div className="fcol">
            <h4>Learn</h4>
            <ul>
              <li><Link href="/subjects">MCQ Practice</Link></li>
              <li><Link href="/tests">Mock Tests</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          <div className="fcol">
            <h4>Company</h4>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/pricing">Plans</Link></li>
              <li><Link href="/login">Log In</Link></li>
              <li><Link href="/register">Get Started</Link></li>
            </ul>
          </div>
        </div>

        <div className="fb-bot">
          <span>© {year} MDCAT Preparation. Built for Pakistani medical aspirants.</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/contact">Contact</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
