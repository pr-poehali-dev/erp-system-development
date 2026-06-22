import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

interface PlaceholderProps {
  title: string;
  icon: string;
  subtitle?: string;
}

const Placeholder = ({ title, icon, subtitle }: PlaceholderProps) => {
  return (
    <Layout title={title} titleIcon={icon} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in opacity-0">
        <div className="w-20 h-20 rounded-3xl bg-gold/10 flex items-center justify-center mb-6">
          <Icon name={icon} size={36} className="text-gold" />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Модуль «{title}»</h2>
        <p className="text-muted-foreground max-w-md">
          Раздел в разработке. Напишите, какие функции и элементы здесь нужны — и я соберу его по дизайну, как остальные модули.
        </p>
      </div>
    </Layout>
  );
};

export default Placeholder;
