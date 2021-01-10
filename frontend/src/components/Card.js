import React from 'react';
import hexaBlue from '../assets/png/hexaBlue.png';
import hexaGreen from '../assets/png/hexaGreen.png';
import hexaOrange from '../assets/png/hexaOrange.png';
import hexaPurple from '../assets/png/hexaPurple.png';
import hexaRed from '../assets/png/hexaRed.png';
import hexaYellow from '../assets/png/hexaYellow.png';
import hexaFireball from '../assets/png/hexaFireball.png';



/*
Card is a visual representation of a card in a player's hand.
It can be one of 6+1 colors, 6 colors being valid, matchable cards, 
and 1 color being the Fireball, a "bomb" card that causes the player holding it to lose once another player is holding 4 matching cards.

className : a variable that can hold a string with multiple CSS classes
value : an index matching a card color
onClick : an onClick event handler
offered : an indicator of this card currently being offered to the receiving player
restricted : an indicator for the face that this card has been offered and declined by the receiving player, and so may not be offered again in this turn.   
*/
const Card = ({ className, value, onClick, offered = null, restricted = null }) => {

    const valueToPNG = [hexaFireball, hexaRed, hexaGreen, hexaYellow, hexaOrange, hexaPurple, hexaBlue];

    return <div className={className} onClick={onClick} style={{ width: 'min-content', height: 'min-content' }}>
        {offered && 'Offer'}
        {!offered && restricted && "Declined!"}
        <img className='cardImg' src={valueToPNG[value]} />
    </div>
}

export default Card;