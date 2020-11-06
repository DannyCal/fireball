import React from 'react';
import hexaBlue from '../assets/png/hexaBlue.png';
import hexaGreen from '../assets/png/hexaGreen.png';
import hexaOrange from '../assets/png/hexaOrange.png';
import hexaPurple from '../assets/png/hexaPurple.png';
import hexaRed from '../assets/png/hexaRed.png';
import hexaYellow from '../assets/png/hexaYellow.png';
import hexaFireball from '../assets/png/hexaFireball.png';




const Card = ({ className, value, onClick, offered = null, restricted = null }) => {

    const valueToPNG = [hexaFireball, hexaRed, hexaGreen, hexaYellow, hexaOrange, hexaPurple, hexaBlue];

    return <div className={className} onClick={onClick} style={{ width: 'min-content', height: 'min-content' }}>
        {offered && 'Offer'}
        {!offered && restricted && "Declined!"}
        <img className='cardImg' src={valueToPNG[value]} />
    </div>
}

export default Card;