import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface District {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  district_id: string;
}

const ManageDistricts = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDistrictsAndTeachers();
  }, []);

  useEffect(() => {
    if (!selectedDistrict) {
      setClasses([]);
      return;
    }
    fetchClasses(selectedDistrict);
  }, [selectedDistrict]);

  const fetchDistrictsAndTeachers = async () => {
    setLoading(true);
    const { data: districtsRes, error } = await supabase.from("districts").select("id, name");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setDistricts(districtsRes || []);

    // fetch teachers
    const { data: teacherProfiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", supabase.from("user_roles").select("user_id").eq("role", "teacher"));

    // fallback: query join manually
    let teacherList: Array<{ id: string; email: string; full_name: string }> = [];
    try {
      const { data } = await supabase.rpc("get_teachers_list");
      if (data) {
        teacherList = data;
      }
    } catch (e) {
      // fallback method
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      const ids = roles?.map((r: any) => r.user_id) || [];
      if (ids.length > 0) {
        const { data: profilesRes } = await supabase.from("profiles").select("user_id, email, full_name").in("user_id", ids);
        teacherList = profilesRes?.map((p: any) => ({ id: p.user_id, email: p.email, full_name: p.full_name })) || [];
      }
    }

    setTeachers(teacherList);
    setLoading(false);
  };

  const fetchClasses = async (districtId: string) => {
    const { data, error } = await supabase.from("classes").select("id, name, district_id").eq("district_id", districtId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setClasses(data || []);
  };

  const handleCreateDistrict = async () => {
    if (!newDistrictName) return;
    const { error } = await supabase.from("districts").insert([{ name: newDistrictName }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewDistrictName("");
    fetchDistrictsAndTeachers();
  };

  const handleCreateClass = async () => {
    if (!newClassName || !selectedDistrict) return;
    const { error } = await supabase.from("classes").insert([{ name: newClassName, district_id: selectedDistrict }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewClassName("");
    fetchClasses(selectedDistrict);
  };

  const handleAssignTeacherToDistrict = async () => {
    if (!selectedDistrict || (!teacherEmail && !teachers.length)) return;
    let teacherId: string | null = null;
    if (teacherEmail) {
      const { data: profile } = await supabase.from("profiles").select("user_id, email").eq("email", teacherEmail).single();
      if (!profile) {
        toast({ title: "Not found", description: "No user with that email", variant: "destructive" });
        return;
      }
      teacherId = profile.user_id;
    } else if (teachers.length > 0) {
      // pick first teacher in list as fallback
      teacherId = teachers[0].id;
    }

    if (!teacherId) return;

    const { error } = await supabase.from("district_teachers").insert([{ district_id: selectedDistrict, teacher_id: teacherId }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Teacher assigned to district" });
  };

  const handleAddStudentToClass = async () => {
    if (!studentEmail || !selectedClass) return;
    const { data: profile } = await supabase.from("profiles").select("user_id, email").eq("email", studentEmail).single();
    if (!profile) {
      toast({ title: "Not found", description: "No user with that email", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("class_students").insert([{ class_id: selectedClass, student_id: profile.user_id }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Student added to class" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">School Districts</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>District Name</Label>
                <Input value={newDistrictName} onChange={(e) => setNewDistrictName(e.target.value)} placeholder="Metro District" />
              </div>
              <Button className="w-full btn-primary" onClick={handleCreateDistrict}>Create</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>District</Label>
                <Select value={selectedDistrict || ""} onValueChange={(v) => setSelectedDistrict(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Class Name</Label>
                <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Class A" />
              </div>
              <Button className="w-full btn-primary" onClick={handleCreateClass}>Create Class</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Assign Teacher / Add Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Select District</Label>
                <Select value={selectedDistrict || ""} onValueChange={(v) => setSelectedDistrict(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Assign Teacher by Email</Label>
                <Input value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="teacher@example.com" />
                <div className="text-sm text-muted-foreground mt-1">Or pick from existing teachers below</div>
                <div className="mt-2">
                  <Select value={""} onValueChange={(v) => setTeacherEmail(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.email}>{t.full_name} — {t.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full btn-primary mt-2" onClick={handleAssignTeacherToDistrict}>Assign Teacher</Button>
              </div>

              <hr />

              <div className="space-y-1">
                <Label>Select Class</Label>
                <Select value={selectedClass || ""} onValueChange={(v) => setSelectedClass(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Add Student by Email to Class</Label>
                <Input value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@example.com" />
              </div>
              <Button className="w-full btn-primary" onClick={handleAddStudentToClass}>Add Student</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Districts & Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {districts.map((d) => (
                <div key={d.id} className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-sm text-muted-foreground">{classes.filter(c => c.district_id === d.id).length} classes</p>
                    </div>
                    <div>
                      <Button variant="ghost" size="icon">...</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageDistricts;
