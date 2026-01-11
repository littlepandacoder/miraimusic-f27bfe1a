import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About Us" },
    { href: "#contact", label: "Contact Us" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-foreground">​Musicable</Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isHomePage && navLinks.map(link => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
            <Link to="/skool-community" className="nav-link text-pink font-semibold">
              Skool Community
            </Link>
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              Portal Login
            </Link>
            <Link to="/book-class" className="btn-primary text-sm px-6 py-3">
              Book a Class
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            {isHomePage && navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/skool-community"
              className="nav-link py-2 text-pink font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Skool Community
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 nav-link py-2 font-medium"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              Portal Login
            </Link>
            <Link
              to="/book-class"
              className="btn-primary text-sm text-center"
              onClick={() => setIsOpen(false)}
            >
              Book a Class
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;