import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LeadEngineSettings() {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: true,
    apiKey: "",
    phoneNumber: "",
    defaultTemplate: "",
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
  });
  const [scoringRules, setScoringRules] = useState({
    sourceWeight: 50,
    responseTimeWeight: 30,
    engagementWeight: 20,
    hotThreshold: 70,
    warmThreshold: 50,
  });
  const [quoteTemplates, setQuoteTemplates] = useState([
    { id: 1, name: "Standard Quote", content: "Thank you for your interest..." },
    { id: 2, name: "Premium Quote", content: "We're excited to offer..." },
  ]);
  const [leadSources, setLeadSources] = useState([
    { id: 1, source: "Website", score: 10, enabled: true },
    { id: 2, source: "Phone", score: 15, enabled: true },
    { id: 3, source: "Referral", score: 20, enabled: true },
    { id: 4, source: "Social Media", score: 8, enabled: false },
  ]);
  const [autoAssignRules, setAutoAssignRules] = useState([
    { id: 1, condition: "Service Type = Plumbing", staff: "John Doe", enabled: true },
    { id: 2, condition: "City = New York", staff: "Jane Smith", enabled: true },
  ]);
  const [reviewAutomation, setReviewAutomation] = useState(true);
  const [referralAutomation, setReferralAutomation] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    // Save all settings - replace with actual API call
    console.log("Saving settings...");
  };

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

        {/* Settings Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-0 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Engine Settings</h1>
          <p className="text-gray-500 mt-2">Configure automation and lead management settings</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="automation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email SMTP</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="assign">Auto-Assign</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Enable or disable all automation features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable All Automation</Label>
                  <p className="text-sm text-gray-500">Turn on/off all automated follow-ups and sequences</p>
                </div>
                <Switch
                  checked={automationEnabled}
                  onCheckedChange={setAutomationEnabled}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label className="text-base font-medium">Review Automation</Label>
                  <p className="text-sm text-gray-500">Automatically request reviews after service completion</p>
                </div>
                <Switch
                  checked={reviewAutomation}
                  onCheckedChange={setReviewAutomation}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label className="text-base font-medium">Referral Automation</Label>
                  <p className="text-sm text-gray-500">Automatically send referral requests to satisfied customers</p>
                </div>
                <Switch
                  checked={referralAutomation}
                  onCheckedChange={setReferralAutomation}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
              <CardDescription>Configure WhatsApp integration for automated messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable WhatsApp Automation</Label>
                <Switch
                  checked={whatsappSettings.enabled}
                  onCheckedChange={(checked) =>
                    setWhatsappSettings({ ...whatsappSettings, enabled: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-api-key">API Key</Label>
                <Input
                  id="whatsapp-api-key"
                  type="password"
                  value={whatsappSettings.apiKey}
                  onChange={(e) =>
                    setWhatsappSettings({ ...whatsappSettings, apiKey: e.target.value })
                  }
                  placeholder="Enter WhatsApp API key"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-phone">Phone Number</Label>
                <Input
                  id="whatsapp-phone"
                  value={whatsappSettings.phoneNumber}
                  onChange={(e) =>
                    setWhatsappSettings({ ...whatsappSettings, phoneNumber: e.target.value })
                  }
                  placeholder="+1234567890"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp-template">Default Template</Label>
                <Textarea
                  id="whatsapp-template"
                  value={whatsappSettings.defaultTemplate}
                  onChange={(e) =>
                    setWhatsappSettings({ ...whatsappSettings, defaultTemplate: e.target.value })
                  }
                  placeholder="Enter default WhatsApp message template"
                  className="mt-1"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email SMTP Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email SMTP Settings</CardTitle>
              <CardDescription>Configure SMTP server for sending automated emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailSettings.smtpHost}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                    }
                    placeholder="smtp.gmail.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                    }
                    placeholder="587"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    value={emailSettings.smtpUser}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                    }
                    placeholder="your-email@gmail.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                    }
                    placeholder="Enter password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                    }
                    placeholder="noreply@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={emailSettings.fromName}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, fromName: e.target.value })
                    }
                    placeholder="Your Company Name"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button variant="outline">Test SMTP Connection</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Rules Tab */}
        <TabsContent value="scoring">
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Rules</CardTitle>
              <CardDescription>Configure weights and thresholds for lead scoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Source Weight</Label>
                  <span className="text-sm text-gray-500">{scoringRules.sourceWeight}%</span>
                </div>
                <Slider
                  value={[scoringRules.sourceWeight]}
                  onValueChange={([value]) =>
                    setScoringRules({ ...scoringRules, sourceWeight: value })
                  }
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Response Time Weight</Label>
                  <span className="text-sm text-gray-500">{scoringRules.responseTimeWeight}%</span>
                </div>
                <Slider
                  value={[scoringRules.responseTimeWeight]}
                  onValueChange={([value]) =>
                    setScoringRules({ ...scoringRules, responseTimeWeight: value })
                  }
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Engagement Weight</Label>
                  <span className="text-sm text-gray-500">{scoringRules.engagementWeight}%</span>
                </div>
                <Slider
                  value={[scoringRules.engagementWeight]}
                  onValueChange={([value]) =>
                    setScoringRules({ ...scoringRules, engagementWeight: value })
                  }
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div className="border-t pt-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Hot Lead Threshold</Label>
                    <span className="text-sm text-gray-500">{scoringRules.hotThreshold}+</span>
                  </div>
                  <Slider
                    value={[scoringRules.hotThreshold]}
                    onValueChange={([value]) =>
                      setScoringRules({ ...scoringRules, hotThreshold: value })
                    }
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Warm Lead Threshold</Label>
                    <span className="text-sm text-gray-500">{scoringRules.warmThreshold}+</span>
                  </div>
                  <Slider
                    value={[scoringRules.warmThreshold]}
                    onValueChange={([value]) =>
                      setScoringRules({ ...scoringRules, warmThreshold: value })
                    }
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Templates Tab */}
        <TabsContent value="quotes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quote Templates</CardTitle>
                  <CardDescription>Manage quote templates for automated sending</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quoteTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={template.content}
                        onChange={(e) => {
                          setQuoteTemplates(
                            quoteTemplates.map((t) =>
                              t.id === template.id ? { ...t, content: e.target.value } : t
                            )
                          );
                        }}
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Sources Mapping Tab */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lead Sources Mapping</CardTitle>
                  <CardDescription>Configure scoring and settings for each lead source</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">{source.source}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={source.score}
                          onChange={(e) => {
                            setLeadSources(
                              leadSources.map((s) =>
                                s.id === source.id
                                  ? { ...s, score: parseInt(e.target.value) || 0 }
                                  : s
                              )
                            );
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={source.enabled}
                          onCheckedChange={(checked) => {
                            setLeadSources(
                              leadSources.map((s) =>
                                s.id === source.id ? { ...s, enabled: checked } : s
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Assign Rules Tab */}
        <TabsContent value="assign">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Auto-Assign Rules</CardTitle>
                  <CardDescription>Automatically assign leads to staff based on conditions</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {autoAssignRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <Label>Condition</Label>
                            <Input
                              value={rule.condition}
                              onChange={(e) => {
                                setAutoAssignRules(
                                  autoAssignRules.map((r) =>
                                    r.id === rule.id
                                      ? { ...r, condition: e.target.value }
                                      : r
                                  )
                                );
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Assign To</Label>
                            <Select
                              value={rule.staff}
                              onValueChange={(value) => {
                                setAutoAssignRules(
                                  autoAssignRules.map((r) =>
                                    r.id === rule.id ? { ...r, staff: value } : r
                                  )
                                );
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="John Doe">John Doe</SelectItem>
                                <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                                <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center gap-2 w-full">
                              <Label>Enabled</Label>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  setAutoAssignRules(
                                    autoAssignRules.map((r) =>
                                      r.id === rule.id ? { ...r, enabled: checked } : r
                                    )
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-4">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review & Referral Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Referral Automation</CardTitle>
              <CardDescription>Configure automated review and referral requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Review Automation</Label>
                    <p className="text-sm text-gray-500">Automatically request reviews after service completion</p>
                  </div>
                  <Switch
                    checked={reviewAutomation}
                    onCheckedChange={setReviewAutomation}
                  />
                </div>
                <div className="pl-4 border-l-2 space-y-3">
                  <div>
                    <Label>Review Request Delay</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" defaultValue={24} className="w-20" />
                      <Select defaultValue="hours">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Review Template</Label>
                    <Textarea
                      placeholder="Enter review request message template"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Referral Automation</Label>
                    <p className="text-sm text-gray-500">Automatically send referral requests to satisfied customers</p>
                  </div>
                  <Switch
                    checked={referralAutomation}
                    onCheckedChange={setReferralAutomation}
                  />
                </div>
                <div className="pl-4 border-l-2 space-y-3">
                  <div>
                    <Label>Referral Request Delay</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" defaultValue={7} className="w-20" />
                      <Select defaultValue="days">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Referral Template</Label>
                    <Textarea
                      placeholder="Enter referral request message template"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Referral Incentive</Label>
                    <Input
                      placeholder="e.g., $50 credit"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

