import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

// Google Maps API types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface AddressDetails {
  formattedAddress: string;
  streetNumber?: string;
  route?: string;
  locality?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressDetails) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Rechercher une adresse...",
  className,
  value = '',
  required = false,
  disabled = false,
  'data-testid': dataTestId
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!window.google || !inputRef.current) return;

      try {
        // Initialize Google Places Autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'fr' }, // Restrict to France
          fields: ['geometry', 'formatted_address', 'address_components'],
          // Bias results towards Gironde region (Bordeaux coordinates)
          locationBias: {
            radius: 50000, // 50km radius
            center: { lat: 44.8378, lng: -0.5792 } // Bordeaux coordinates
          }
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            setError('Veuillez sélectionner une adresse valide dans la liste');
            return;
          }

          setError('');
          const addressDetails = parseAddressComponents(place);
          setInputValue(addressDetails.formattedAddress);
          onAddressSelect(addressDetails);
        });

        setError('');
      } catch (err) {
        console.error('Error initializing Google Maps Autocomplete:', err);
        setError('Erreur de chargement de l\'autocomplétion');
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      setIsLoading(true);
      const script = document.createElement('script');
      // Only load Google Maps if we have a valid API key
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setIsLoading(false);
        setError('');
        return;
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        setIsLoading(false);
        initializeAutocomplete();
      };
      
      script.onerror = () => {
        setIsLoading(false);
        setError('Erreur de chargement de Google Maps');
      };
      
      document.head.appendChild(script);
    } else {
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect]);

  const parseAddressComponents = (place: any): AddressDetails => {
    const addressDetails: AddressDetails = {
      formattedAddress: place.formatted_address || '',
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng()
    };

    // Parse address components
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        
        if (types.includes('street_number')) {
          addressDetails.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          addressDetails.route = component.long_name;
        } else if (types.includes('locality')) {
          addressDetails.locality = component.long_name;
        } else if (types.includes('postal_code')) {
          addressDetails.postalCode = component.long_name;
        } else if (types.includes('country')) {
          addressDetails.country = component.long_name;
        }
      }
    }

    return addressDetails;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !window.google) {
      // If Google Maps is not available, treat manual input as selected address
      onAddressSelect({
        formattedAddress: inputValue.trim()
      });
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() && !window.google) {
      // If Google Maps is not available, treat manual input as selected address
      onAddressSelect({
        formattedAddress: inputValue.trim()
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          required={required}
          disabled={disabled || isLoading}
          data-testid={dataTestId}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" data-testid="text-address-error">
          {error}
        </p>
      )}
    </div>
  );
}