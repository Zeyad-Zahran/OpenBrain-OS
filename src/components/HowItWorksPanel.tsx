import { ArrowLeft, Download, Github, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppSettings } from '@/hooks/useAppSettings';
import { t, getDir } from '@/lib/i18n';
import { RESEARCH_AR, RESEARCH_EN } from '@/content/research';

const GITHUB_URL = 'https://github.com/Zeyad-Zahran/OpenBrain-OS';
const PDF_URL = '/DecentralizingIntelligence.pdf';

interface HowItWorksPanelProps {
  onBack: () => void;
}

export function HowItWorksPanel({ onBack }: HowItWorksPanelProps) {
  const { locale } = useAppSettings();
  const dir = getDir(locale);
  const content = locale === 'ar' ? RESEARCH_AR : RESEARCH_EN;

  return (
    <div dir={dir} className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label={t(locale, 'back')}>
            <ArrowLeft className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </Button>
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{t(locale, 'researchTitle')}</h1>
            <p className="text-xs text-muted-foreground truncate">{t(locale, 'researchSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a href={PDF_URL} download>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t(locale, 'downloadPdf')}</span>
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">{t(locale, 'starOnGithub')}</span>
            </a>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 scrollbar-thin">
        <article className="mx-auto max-w-3xl px-6 py-8 prose prose-invert prose-sm md:prose-base max-w-none
            prose-headings:text-foreground
            prose-p:text-foreground/90
            prose-strong:text-foreground
            prose-a:text-primary hover:prose-a:underline
            prose-code:text-accent-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
            prose-table:text-sm
            prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2
            prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
            prose-hr:border-border">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </ScrollArea>
    </div>
  );
}
