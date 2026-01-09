function SocialLink({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border bg-background p-2 text-sm font-medium transition hover:bg-muted"
    >
      <div className="text-primary text-xl">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  );
}

export default SocialLink;
