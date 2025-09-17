use strict; use warnings; use JSON::PP;
my $json = do { local $/; open my $f, q{songs-2025.json} or die $!; <$f> };
my $rows = JSON::PP->new->decode($json);
open my $o, q{> songs-2025.js} or die $!;
print $o "window.SONGS_2025 = [\n";
for my $i (0..$#$rows){
  my $r = $rows->[$i];
  my ($t,$a,$l) = map { $r->{$_}//'' } qw/title artist link/;
  # If link is an iframe (raw or HTML-escaped), extract the src URL
  my $decoded = $l; $decoded =~ s/&lt;/</g; $decoded =~ s/&gt;/>/g; $decoded =~ s/&amp;/&/g;
  if ($decoded =~ /<iframe/i && $decoded =~ /src=\"([^\"]+)/i){ $l = $1; }
  my ($sp,$yt,$sc) = ('','','');
  if ($l =~ /spotify\.com/) { $sp = $l; }
  elsif ($l =~ /youtu(\.be|be\.com)/) { $yt = $l; }
  elsif ($l =~ /soundcloud\.com/) { $sc = $l; }
  # escape fields for JS string literal
  for ($t,$a,$sp,$yt,$sc){ s/"/\\\"/g if defined $_ }
  my $line = sprintf(
    '  { title: "%s", artist: "%s"%s%s%s }%s' . "\n",
    $t, $a,
    $sp ? ", spotify: \"$sp\"" : '',
    $yt ? ", youtube: \"$yt\"" : '',
    $sc ? ", soundcloud: \"$sc\"" : '',
    ($i==$#$rows ? '' : ',')
  );
  print $o $line;
}
print $o "]\n";
