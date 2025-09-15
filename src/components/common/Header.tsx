import React from 'react';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <div id="header-ui" className={className}>
      <div>
        <a href="https://mesh2motion.org">
          <img 
            src="images/mesh2motion.svg" 
            width="200" 
            style={{ verticalAlign: 'middle' }} 
            alt="Mesh2Motion"
          />
        </a>
      </div>

      <div style={{ marginLeft: '3rem' }}>
        <img 
          src="images/mouse-left.svg" 
          height="30" 
          width="30" 
          style={{ verticalAlign: 'middle' }} 
          alt="Left mouse"
        /> 
        Rotate
      </div>

      <div>
        <img 
          src="images/mouse-right.svg" 
          height="30" 
          width="30" 
          style={{ verticalAlign: 'middle' }} 
          alt="Right mouse"
        /> 
        Pan
      </div>

      <div>
        <img 
          src="images/mouse-middle.svg" 
          height="30" 
          width="30" 
          style={{ verticalAlign: 'middle' }} 
          alt="Middle mouse"
        /> 
        Zoom
      </div>
    </div>
  );
};
