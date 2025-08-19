import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function MeetingTimes() {
  const t = useTranslations("MeetingTimes");

  const meetingData = [
    {
      activity: t("sundayPrayer"),
      time: t("sundayPrayerTime"),
      location: t("sundayPrayerLocation"),
    },
    {
      activity: t("adultWorship"),
      time: t("adultWorshipTime"),
      location: t("adultWorshipLocation"),
    },
    {
      activity: t("adultSundaySchool"),
      time: t("adultSundaySchoolTime"),
      location: t("adultSundaySchoolLocation"),
    },
    {
      activity: t("gospelClass"),
      time: t("gospelClassTime"),
      location: t("gospelClassLocation"),
    },
    {
      activity: t("youthWorship"),
      time: t("youthWorshipTime"),
      location: t("youthWorshipLocation"),
    },
    {
      activity: t("youthSundaySchool"),
      time: t("youthSundaySchoolTime"),
      location: t("youthSundaySchoolLocation"),
    },
    {
      activity: t("childrenWorship"),
      time: t("childrenWorshipTime"),
      location: t("childrenWorshipLocation"),
    },
    {
      activity: t("choirPractice"),
      time: t("choirPracticeTime"),
      location: t("choirPracticeLocation"),
    },
    {
      activity: t("tuesdayPrayer"),
      time: t("tuesdayPrayerTime"),
      location: t("tuesdayPrayerLocation"),
    },
    {
      activity: t("calebFellowship"),
      time: t("calebFellowshipTime"),
      location: t("calebFellowshipLocation"),
    },
    {
      activity: t("campusFellowship"),
      time: t("campusFellowshipTime"),
      location: t("campusFellowshipLocation"),
    },
    {
      activity: t("familyFellowship"),
      time: t("familyFellowshipTime"),
      location: t("familyFellowshipLocation"),
    },
    {
      activity: t("brotherhoodMeeting"),
      time: t("brotherhoodMeetingTime"),
      location: t("brotherhoodMeetingLocation"),
    },
    {
      activity: t("sisterhoodMeeting"),
      time: t("sisterhoodMeetingTime"),
      location: t("sisterhoodMeetingLocation"),
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-12">
            {t("title")}
          </h1>

          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {t("activity")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {t("time")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    {t("location")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {meetingData.map((meeting, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100">
                      {meeting.activity}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium border-b border-gray-100">
                      {meeting.time}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
                      {meeting.location.startsWith("https://") ? (
                        <a
                          href={meeting.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {meeting.location}
                        </a>
                      ) : (
                        meeting.location
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
