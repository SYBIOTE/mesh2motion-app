import React from 'react';

interface GitHubLinkProps {
  href?: string;
  className?: string;
}

export const GitHubLink: React.FC<GitHubLinkProps> = ({ 
  href = "https://github.com/scottpetrovic/mesh2motion-app",
  className 
}) => {
  return (
    <a id="github-logo" href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <img src="images/GitHub_Logo_White.png" alt="GitHub Repository" />
    </a>
  );
};
