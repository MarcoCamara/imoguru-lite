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
      className="w-full py-6 px-4 md:px-8 mt-12"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo e Nome da Empresa */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            {companyLogo && (
              <img 
                src={companyLogo} 
                alt={companyName}
                className="h-12 w-auto object-contain"
              />
            )}
            <h3 className="text-white font-bold text-lg">{companyName}</h3>
          </div>

          {/* Informações de Contato */}
          <div className="flex flex-col space-y-3 text-center md:text-left">
            <h4 className="text-white font-semibold text-base mb-2">Contato</h4>
            
            {companyPhone && (
              <a 
                href={`tel:${companyPhone.replace(/\D/g, '')}`}
                className="flex items-center justify-center md:justify-start space-x-2 text-white hover:text-gray-200 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">{companyPhone}</span>
              </a>
            )}
            
            {companyEmail && (
              <a 
                href={`mailto:${companyEmail}`}
                className="flex items-center justify-center md:justify-start space-x-2 text-white hover:text-gray-200 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">{companyEmail}</span>
              </a>
            )}
            
            {(companyAddress || companyCity) && (
              <div className="flex items-start justify-center md:justify-start space-x-2 text-white">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  {companyAddress && <div>{companyAddress}</div>}
                  {(companyCity || companyState) && (
                    <div>{companyCity}{companyCity && companyState && ' - '}{companyState}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Redes Sociais */}
          <div className="flex flex-col items-center md:items-end space-y-3">
            <h4 className="text-white font-semibold text-base mb-2">Redes Sociais</h4>
            <div className="flex items-center space-x-4">
              {companyFacebook && (
                <a
                  href={companyFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-6 w-6" />
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
                  <Instagram className="h-6 w-6" />
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
                  <FaWhatsapp className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

