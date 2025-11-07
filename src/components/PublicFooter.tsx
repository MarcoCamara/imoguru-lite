import { Phone, MapPin, Facebook, Instagram, Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface PublicFooterProps {
  companyName: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyEmail?: string;
  companyFacebook?: string;
  companyInstagram?: string;
  companyWhatsapp?: string;
  companyLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function PublicFooter({
  companyName,
  companyPhone,
  companyAddress,
  companyCity,
  companyState,
  companyEmail,
  companyFacebook,
  companyInstagram,
  companyWhatsapp,
  companyLogo,
  primaryColor = '#000000',
  secondaryColor = '#333333',
}: PublicFooterProps) {
  return (
    <footer 
      className="w-full py-4 sm:py-6 px-3 sm:px-4 md:px-8 mt-8 sm:mt-12 overflow-x-hidden"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Logo da Empresa */}
          <div className="flex flex-col items-center sm:items-start space-y-2 sm:space-y-3">
            {companyLogo && (
              <img 
                src={companyLogo} 
                alt={companyName}
                className="h-10 sm:h-12 w-auto object-contain max-w-[150px] sm:max-w-none"
              />
            )}
          </div>

          {/* Informações de Contato */}
          <div className="flex flex-col space-y-2 sm:space-y-3 text-center sm:text-left">
            <h4 className="hidden sm:block text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">Contato</h4>
            
            {companyPhone && (
              <a 
                href={`tel:${companyPhone.replace(/\D/g, '')}`}
                className="flex items-center justify-center sm:justify-start space-x-2 text-white hover:text-gray-200 transition-colors text-sm sm:text-base break-words"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="break-all">{companyPhone}</span>
              </a>
            )}
            
            {companyEmail && (
              <a 
                href={`mailto:${companyEmail}`}
                className="flex items-center justify-center sm:justify-start space-x-2 text-white hover:text-gray-200 transition-colors text-xs sm:text-sm break-words"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-all">{companyEmail}</span>
              </a>
            )}
            
            {(companyAddress || companyCity) && (
              <div className="flex items-start justify-center sm:justify-start space-x-2 text-white text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                <div className="break-words flex flex-col">
                  {companyAddress && <span>{companyAddress}</span>}
                  {(companyCity || companyState) && (
                    <span>{companyCity}{companyCity && companyState && ' - '}{companyState}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Redes Sociais */}
          <div className="flex flex-col items-center sm:items-center md:items-end space-y-2 sm:space-y-3">
            <h4 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2">Redes Sociais</h4>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {companyFacebook && (
                <a
                  href={companyFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              )}
              
              {companyInstagram && (
                <a
                  href={companyInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-pink-400 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              )}
              
              {companyWhatsapp && (
                <a
                  href={`https://wa.me/${companyWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 transition-colors"
                  title="WhatsApp"
                >
                  <FaWhatsapp className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20 text-center">
          <p className="text-white/80 text-xs sm:text-sm break-words">
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

