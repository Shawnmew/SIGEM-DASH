import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shadow-lg bg-white dark:bg-gray-800">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Trocar idioma / Alternar Lingua</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('pt')}>
          Português (AO)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('kmb')}>
          Kimbundu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('umb')}>
          Umbundu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('kon')}>
          Kikongo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('lin')}>
          Lingala
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
