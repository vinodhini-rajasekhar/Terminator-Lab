export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Read this first.</span> Everything here replays{' '}
          <em>logged</em> behaviour from Emergence World (Emergence AI, CC BY-NC 4.0). Counterfactuals are{' '}
          <em>first-order</em>: a halt removes the events that were logged afterwards; it cannot show what agents would
          have done differently. Each world is one run, so these are case studies, not model rankings.
        </p>
        <p className="font-mono text-xs">
          {'TerminatorLab \u00b7 Responsible AI course project \u00b7 Data: '}
          <a
            href="https://github.com/EmergenceAI/Emergence-World"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Emergence-World
          </a>
          {' \u00b7 Paper: '}
          <a
            href="https://arxiv.org/abs/2606.08367"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            arXiv:2606.08367
          </a>
        </p>
      </div>
    </footer>
  )
}
