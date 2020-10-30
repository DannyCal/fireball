import React from 'react';
import { valueToSVG } from '../assets/svg/cardSvgs';


const Card = ({ value, onClick, selectionNumber = null }) => {

    return <div onClick={onClick} style={{ width: 'min-content', height: 'min-content' }}>
        {(selectionNumber !== -1) && selectionNumber}
        {valueToSVG[value](0.2)}
    </div>
}

export default Card;