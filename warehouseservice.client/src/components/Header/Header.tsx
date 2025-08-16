import React from "react";
import UserWidget from "../UserWidget/UserWidget";
import toggleDots from "../../assets/Toggle_Dots.svg";
import {
    Logout,
    Return
} from "../../utils/api/sessions";

import { useAppContext } from "../../hooks/useAppContext";
import { usePopup } from "../../hooks/usePopup";
import { useNavigate } from "react-router-dom";

import "./Header.css";

// define the prop interface...
interface HeaderProps {
    company: string[];
    title: string;
    subtitle: string;
    currUser: string;
    logoutButton?: boolean;
    root: boolean;
};

const Header: React.FC<HeaderProps> = ({
    company,
    title,
    subtitle,
    currUser,
    logoutButton,
    root
}) => {
    const {
        collapsed, setCollapsed,
        session,
    } = useAppContext();

    const {
        /*popupType,*/
        openPopup, /*closePopup,*/
        /*popupVisible,*/
    } = usePopup();

    const navigate = useNavigate();

    const toggleHeader = () => {
        setCollapsed(prevCollapsed => !prevCollapsed);
        const collapsedSS = sessionStorage.getItem("collapsed") === "true";
        sessionStorage.setItem("collapsed", (!collapsedSS).toString());
    }

    async function popupReturn(root: boolean) {
        if (root) {
            openPopup("return");
        }

        const path = await Return(root, session.id.toString());

        // This is a good place to check if the session exists before using it.
        // if (session?.id) { ... }

        if (path) {
            navigate(path);
        }
    }

    const popupLogout = () => {
        openPopup("logout");
        Logout(session);
    }

    return (
        <>
        <header className={`header ${collapsed ? "collapsed-header" : ''}`}>
            <div className={`buffer ${collapsed ? "collapsed-buffer" : ''}`} />
            <div className={`company_title ${collapsed ? "hidden" : ''}`}>
                {company.map((word,index) => (
                    <h4 className="company_list_title" key={index}>{word}</h4>
                ))}
            </div>
            <div className="sticky_header">
                <div className={`module_title ${collapsed ? "hidden" : ''}`}>
                    <h1>{title}</h1>
                    <h2>{subtitle}</h2>
                </div>
                <div id="collapse_toggle_button" onClick={toggleHeader}>
                    <img id="toggle_dots" src={toggleDots} alt="toggle dots" />
                </div>
                <UserWidget 
                    currUser={currUser}
                    logoutButton={logoutButton}
                    root={root}
                    popupReturn={popupReturn}
                    popupLogout={popupLogout}
                />
            </div>
        </header>
        {/*popupVisible && (
            <Popup 
                popupType={popupType}
                isVisible={popupVisible}
                closePopup={closePopup}
            />
        )*/}
        </>
    )
}

export default Header;