const ScrollingTagline = () => {
  const taglineText = "Unity In Diversity";
  
  return (
    <div className="w-full bg-gradient-to-r from-secondary via-secondary-glow to-secondary py-3 overflow-hidden border-y border-secondary/30 shadow-glow">
      <div className="flex whitespace-nowrap animate-scroll">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex items-center mx-8">
            <span className="text-lg md:text-xl font-heading font-bold text-secondary-foreground tracking-wider">
              {taglineText}
            </span>
            <span className="mx-8 text-secondary-foreground/60">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingTagline;
