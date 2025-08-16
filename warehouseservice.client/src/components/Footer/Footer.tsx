import React from 'react';
import './Footer.css';

interface FooterProps {
    classParam: string;
}

const Footer: React.FC<FooterProps> = ({
    classParam
}) => {
    return (
        <div className={classParam}>
            <p className="footer_text">Developed by Transportation Computer Support, LLC.</p>
        </div>
    )
};

export default Footer;