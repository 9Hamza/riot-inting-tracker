import React from 'react';
import './Footer.css';

function Footer() {
    return (
        <div>
            <footer className="footer border">
                <p>&copy; {new Date().getFullYear()} Inting Tracker</p>
            </footer>
        </div>
    );
}

export default Footer;