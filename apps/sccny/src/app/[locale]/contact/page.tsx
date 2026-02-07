import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Contact() {
  const t = useTranslations("Contact");

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-12">
            {t("title")}
          </h1>

          {/* Church Image */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-full max-w-4xl h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="http://www.scc-ny.org/wp-content/uploads/2012/04/SCC-Church1-e1335324467236.jpg"
                alt="Suffolk Christian Church Building"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Introduction Text */}
          <div className="mb-12">
            <p className="text-lg text-foreground leading-relaxed">
              {t("introText")}
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Phone */}
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t("phone")}
              </h3>
              <p className="text-lg text-primary font-medium">
                <a
                  href={`tel:${t("phoneNumber")}`}
                  className="hover:text-primary/80"
                >
                  {t("phoneNumber")}
                </a>
              </p>
            </div>

            {/* Email */}
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t("email")}
              </h3>
              <p className="text-lg text-primary font-medium">
                <a
                  href={`mailto:${t("emailAddress")}`}
                  className="hover:text-primary/80 break-all"
                >
                  {t("emailAddress")}
                </a>
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="mb-12">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t("address")}
              </h3>
              <p className="text-lg text-foreground">{t("churchAddress")}</p>
            </div>
          </div>

          {/* Driving Directions */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("driveDirection")}
            </h2>

            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-6 border border-border">
                <h4 className="text-lg font-semibold text-foreground mb-3">1.</h4>
                <p className="text-foreground leading-relaxed">
                  {t("direction1")}
                </p>
              </div>

              <div className="bg-muted rounded-lg p-6 border border-border">
                <h4 className="text-lg font-semibold text-foreground mb-3">2.</h4>
                <p className="text-foreground leading-relaxed">
                  {t("direction2")}
                </p>
              </div>
            </div>
          </div>

          {/* Google Map Link */}
          <div className="mb-12">
            <div className="bg-muted rounded-lg p-6 border border-border">
              <p className="text-foreground">
                <a
                  href="https://maps.google.com/maps?q=18+Moriches+Rd,+Lake+Grove,+NY+11755,+USA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline font-medium"
                >
                  {t("mapLink")}
                </a>
              </p>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="mb-12">
            <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.8234567890123!2d-73.1234567!3d40.8765432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s18%20Moriches%20Rd%2C%20Lake%20Grove%2C%20NY%2011755!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Suffolk Christian Church Location"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
