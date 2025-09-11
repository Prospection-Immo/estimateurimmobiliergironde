import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface HeroProps {
  domain?: string;
}

export default function Hero({ domain = "estimation-immobilier-gironde.fr" }: HeroProps) {
  const isGironde = domain.includes("gironde");
  const cityName = isGironde ? "Gironde" : "Bordeaux";

  return (
    <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={bordeaux_house}
          alt="Belle propriété en Gironde"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/80"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
        {/* Centered Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Estimation immobilière Gironde
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-3">
            Expertise immobilière locale
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Chaque mois en Gironde, des centaines de propriétaires comme vous perdent des milliers d'euros en vendant leur bien 15 à 30% sous sa vraie valeur. 
            Notre nouvelle solution d'estimation vous garantit d'éviter cette erreur coûteuse.
          </p>
        </div>
      </div>
    </section>
  );
}