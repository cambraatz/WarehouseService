import React from 'react';
import userIcon from '../../assets/userIcon.png';

import './UserWidget.css';

interface UserWidgetProps {
    logoutButton?: boolean;
    currUser?: string;
    root: boolean;
    popupReturn: (root: boolean) => void;
    popupLogout: () => void;
};

const UserWidget: React.FC<UserWidgetProps> = ({ logoutButton, currUser, root, popupReturn, popupLogout }) => {
    const showLogoutButton = logoutButton ?? true; // show button by default...
    return (
        <div id="uw_div">
            <div id="uw_content">
                <div id="uw_icon_div">
                    <img id="uw_icon" src={userIcon} alt="User Icon" />
                    <p>{currUser}</p>
                </div>
            </div>
            <div id="uw_navButtons">
                <div id="uw_return">
                    <button onClick={() => popupReturn(root)}>Go Back</button>
                </div>
                {showLogoutButton && (
                    <div id="uw_logout">
                        <button onClick={popupLogout}>Log Out</button>
                    </div>
                )}
            </div>
        </div>
    )
};

export default UserWidget;