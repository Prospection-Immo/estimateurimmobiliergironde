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
  department?: string;
  departmentCode?: string;
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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyFetched, setApiKeyFetched] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch Google Maps API key from backend
  const fetchApiKey = async () => {
    if (apiKeyFetched) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/config/google-maps-key');
      
      if (!response.ok) {
        console.warn('Google Maps API key not available, falling back to manual input');
        setApiKey(null);
        setIsLoading(false);
        setApiKeyFetched(true);
        return;
      }
      
      const data = await response.json();
      console.log('AddressAutocomplete: API key fetched successfully:', data.apiKey ? 'YES' : 'NO');
      setApiKey(data.apiKey);
      setApiKeyFetched(true);
    } catch (error) {
      console.warn('Failed to fetch Google Maps API key:', error);
      setApiKey(null);
      setIsLoading(false);
      setApiKeyFetched(true);
    }
  };

  useEffect(() => {
    console.log("AddressAutocomplete: Component mounted, fetching API key...");
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKeyFetched) return;

    const initializeAutocomplete = () => {
      console.log('AddressAutocomplete: initializeAutocomplete called', { 
        hasGoogle: !!window.google, 
        hasInput: !!inputRef.current 
      });
      
      if (!window.google || !inputRef.current) {
        console.log('AddressAutocomplete: Cannot initialize - missing Google or input ref');
        return;
      }

      try {
        console.log('AddressAutocomplete: Starting autocomplete initialization...');
        // Define Gironde bounds (département 33)
        const girondeBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(44.165, -1.50), // SW corner
          new window.google.maps.LatLng(45.688, 0.18)   // NE corner
        );

        // Initialize Google Places Autocomplete - GIRONDE ONLY
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'fr' }, // Restrict to France
          fields: ['geometry', 'formatted_address', 'address_components'],
          bounds: girondeBounds,
          strictBounds: true // Only show addresses within Gironde bounds
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            setError('Veuillez sélectionner une adresse valide dans la liste');
            return;
          }

          // Validate address is in Gironde (département 33)
          if (!isAddressInGironde(place)) {
            setError('🚫 Cette adresse n\'est pas en Gironde (département 33). Notre service est spécialisé uniquement pour la Gironde.');
            setInputValue('');
            if (inputRef.current) {
              inputRef.current.focus();
            }
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

    console.log('AddressAutocomplete: Initializing...', { hasGoogle: !!window.google, hasApiKey: !!apiKey });
    
    // Load Google Maps API if not already loaded and we have an API key
    if (!window.google && apiKey) {
      console.log('AddressAutocomplete: Loading Google Maps script...');
      setIsLoading(true);
      const script = document.createElement('script');
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        console.log('AddressAutocomplete: Google Maps script loaded successfully');
        setIsLoading(false);
        initializeAutocomplete();
      };
      
      script.onerror = () => {
        setIsLoading(false);
        setError('Erreur de chargement de Google Maps');
      };
      
      document.head.appendChild(script);
    } else if (window.google) {
      console.log('AddressAutocomplete: Google Maps already loaded, initializing autocomplete...');
      setIsLoading(false);
      initializeAutocomplete();
    } else {
      console.log('AddressAutocomplete: No API key or Google Maps, falling back to manual input');
      // No API key available, use manual input only
      setIsLoading(false);
      setError('');
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect, apiKey, apiKeyFetched]);

  // Validate address is in Gironde (département 33)
  const isAddressInGironde = (place: any): boolean => {
    if (!place.address_components) return false;

    let postalCode = '';
    let department = '';
    
    // Extract postal code and department from address components
    for (const component of place.address_components) {
      const types = component.types;
      
      if (types.includes('postal_code')) {
        postalCode = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        department = component.long_name;
      }
    }

    // Method 1: Check if department is "Gironde"
    if (department.toLowerCase().includes('gironde')) {
      return true;
    }

    // Method 2: Check if postal code starts with "33"
    if (postalCode && /^33\d{3}$/.test(postalCode)) {
      return true;
    }

    // Method 3: Check if coordinates are within Gironde bounds
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      // Gironde approximate bounds
      const inBounds = lat >= 44.165 && lat <= 45.688 && lng >= -1.50 && lng <= 0.18;
      return inBounds;
    }

    return false;
  };

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
        } else if (types.includes('administrative_area_level_2')) {
          addressDetails.department = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressDetails.departmentCode = component.short_name;
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
      // If Google Maps is not available, validate manual input for Gironde
      const manualAddress = inputValue.trim();
      
      // Check if manual input contains a Gironde postal code (33xxx)
      const hasGirondePostalCode = /\b33\d{3}\b/.test(manualAddress);
      
      if (hasGirondePostalCode) {
        onAddressSelect({
          formattedAddress: manualAddress
        });
      } else {
        setError('🚫 Veuillez saisir une adresse en Gironde (code postal 33xxx)');
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() && !window.google) {
      // If Google Maps is not available, validate manual input for Gironde
      const manualAddress = inputValue.trim();
      
      // Check if manual input contains a Gironde postal code (33xxx)
      const hasGirondePostalCode = /\b33\d{3}\b/.test(manualAddress);
      
      if (hasGirondePostalCode) {
        onAddressSelect({
          formattedAddress: manualAddress
        });
      } else {
        setError('🚫 Veuillez saisir une adresse en Gironde (code postal 33xxx)');
      }
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