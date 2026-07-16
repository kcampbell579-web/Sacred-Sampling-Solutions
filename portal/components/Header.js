import { logout } from "@/app/actions/auth";

const LOGO = "https://www.sacredsamplingsolutions.com/assets/logo-color.png";

export default function Header({ user }) {
  return (
    <header className="hdr">
      <div className="wrap navrow">
        <a className="brand" href={user ? "/dashboard" : "/"} aria-label="Sacred Sampling Solutions">
          <img src={LOGO} alt="Sacred Sampling Solutions" />
        </a>
        <div className="spacer" />
        {user ? (
          <form action={logout} style={{ display: "flex", alignItems: "center" }}>
            <span className="who">{user.email}</span>
            <button className="linkbtn" type="submit">Log out</button>
          </form>
        ) : (
          <a className="linkbtn" href="/login">Log in</a>
        )}
      </div>
    </header>
  );
}
