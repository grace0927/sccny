import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Ministries() {
  const t = useTranslations("Ministries");

  const ministryAreas = [
    {
      title: t("area1"),
      color: "bg-purple-100 border-purple-300",
      headerColor: "bg-purple-500",
      ministries: [
        { name: t("lectureArrangement"), leader: "邹群君/黄克斌/辛正" },
        { name: t("specialMeetings"), leader: "邹群君/黄克斌/辛正" },
        { name: t("sundayWorship"), leader: "冯剑宇/史强强/Brian" },
        { name: t("preaching"), leader: "待定/陆昱/郭炜" },
        { name: t("visitation"), leader: "冯剑宇" },
        { name: t("prayerMeeting"), leader: "邹群君/李莉莉/陈凌宇" },
        { name: t("websiteContent"), leader: "辛正/邹群君/冯剑宇" },
      ],
    },
    {
      title: t("area2"),
      color: "bg-blue-100 border-blue-300",
      headerColor: "bg-blue-500",
      ministries: [
        { name: t("children"), leader: "易修竹/潘荣" },
        { name: t("youth"), leader: "陈纯/蓝丰硕/陈凌宇" },
        { name: t("adultSundaySchool"), leader: "邹群君/黄克斌/辛正" },
        { name: t("teacherTraining"), leader: "邹群君/黄克斌/辛正" },
        { name: t("gospelClass"), leader: "张立群/殷丽/待定" },
        { name: t("baptismClass"), leader: "辛正/张立群/徐有强" },
        { name: t("scholarship"), leader: "张立群/史强强" },
      ],
    },
    {
      title: t("area3"),
      color: "bg-green-100 border-green-300",
      headerColor: "bg-green-500",
      ministries: [
        { name: t("care"), leader: "徐有强/李莉莉/陈纯" },
        { name: t("invitation"), leader: "徐有强/李莉莉/陈纯" },
        { name: t("brotherhood"), leader: "蓝丰硕/年轻同工" },
        { name: t("sisterhood"), leader: "李莉莉/陈纯" },
        { name: t("campusMinistry"), leader: "蓝丰硕/罗慧海尔" },
        { name: t("sportsMinistry"), leader: "王燕桓/宁芳" },
      ],
    },
    {
      title: t("area4"),
      color: "bg-yellow-100 border-yellow-300",
      headerColor: "bg-yellow-500",
      ministries: [
        { name: t("holidayGathering"), leader: "冯剑宇/史强强/Brian" },
        { name: t("childrenFamilyMinistry"), leader: "昂修竹/潘荣" },
        { name: t("baptism"), leader: "张立群/史强强" },
        { name: t("yeshiva"), leader: "陆昱" },
        { name: t("bethel"), leader: "冯剑宇/李莉莉" },
        { name: t("choir"), leader: "郭炜/郑荣" },
      ],
    },
    {
      title: t("area5"),
      color: "bg-red-100 border-red-300",
      headerColor: "bg-red-500",
      ministries: [{ name: t("finance"), leader: "陆昱/郭炜" }],
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

          {/* Introduction */}
          <div className="mb-12 space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {t("introduction")}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Ministry Areas Overview */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {t("ministriesOverview")}
            </h2>

            <div className="space-y-8">
              {ministryAreas.map((area, areaIndex) => (
                <div
                  key={areaIndex}
                  className={`rounded-lg shadow-lg border-2 ${area.color} overflow-hidden`}
                >
                  {/* Area Header */}
                  <div className={`${area.headerColor} text-white py-4 px-6`}>
                    <h3 className="text-xl font-bold text-center">
                      {area.title}
                    </h3>
                  </div>

                  {/* Ministry Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                            Ministry
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                            Leadership
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {area.ministries.map((ministry, ministryIndex) => (
                          <tr
                            key={ministryIndex}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100">
                              {ministry.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-blue-600 font-medium border-b border-gray-100">
                              {ministry.leader}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Get Involved
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We invite you to join us in serving the Lord through these
                various ministries. Each ministry provides opportunities to grow
                in faith, serve others, and build community.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-blue-600 font-semibold">Contact Us</div>
                  <div className="text-gray-600 text-sm">
                    Learn more about getting involved
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-green-600 font-semibold">
                    Join a Ministry
                  </div>
                  <div className="text-gray-600 text-sm">
                    Find your place to serve
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
