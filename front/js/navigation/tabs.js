export function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('tab--active'));
      panels.forEach(panel => panel.classList.remove('panel--active'));

      tab.classList.add('tab--active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('panel--active');
    });
  });
}
